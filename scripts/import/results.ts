/**
 * Import election results from the WA Secretary of State results site.
 *
 * Usage:
 *   npm run import:results -- <year> [--type primary|general]
 *
 * Fetches the per-county CSV exports from results.vote.wa.gov for Benton and
 * Franklin counties, matches each result row to a Race and Candidate in the
 * database, and records voteCount, votePercent, and elected on CandidateRace.
 *
 * When --type is omitted it is inferred from the calendar: through August of
 * the election year the primary is assumed, otherwise the general.
 *
 * Safety:
 * - DRY RUN by default: prints the changes it would make without writing.
 *   Set IMPORT_MODE=db to write to the database.
 * - Rows that cannot be matched confidently are written to
 *   scripts/import/unmatched-results.txt for manual review — never guessed.
 *
 * Winner determination (general elections only): the top vote-getter in each
 * race is marked elected (write-ins excluded). Primaries record counts and
 * percentages but never mark anyone elected. For Richland city council in
 * odd-year generals, the winner with the fewest votes across the council
 * races is marked shortTerm (top vote-getters receive the longer terms).
 */
import fs from 'node:fs'
import path from 'node:path'
import { ElectionType, OfficeType, PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { NameMatcher } from '../../lib/normalize/names'
import {
  electionDateCode,
  fetchCountyResults,
  isWriteIn,
  pickShortTermWinner,
  ResultRow,
  ResultsElectionType,
} from '../../lib/wa-state/results'
import { getOutputMode, isDryRun } from './config'
import { ADDITIONAL_CANDIDATE_ALIASES } from './2025-seats'

dotenv.config()

const prisma = new PrismaClient()

const COUNTIES = ['benton', 'franklin']
const NAMES_CONFIG_PATH = path.resolve(process.cwd(), 'legacy/data/json/load-config-names.json')
const UNMATCHED_PATH = path.resolve(process.cwd(), 'scripts/import/unmatched-results.txt')

/** Number of winners per race. Every race in this system elects one seat. */
const SEATS_PER_RACE = 1

interface NameConfigEntry {
  formattedName: string
  pdcId?: string
  altNames?: string[]
}

type RaceKind =
  | 'council'
  | 'mayor'
  | 'school'
  | 'port'
  | 'measure'
  | 'county-commissioner'
  | 'sheriff'
  | 'prosecutor'
  | 'judge'
  | 'state-senator'
  | 'state-rep'
  | 'us-house'
  | 'us-senate'

/** Race kinds whose jurisdiction spans counties; matched by kind/district/position only. */
const STATE_KINDS = new Set<RaceKind>(['judge', 'state-senator', 'state-rep', 'us-house', 'us-senate'])

interface RaceDescriptor {
  kind: RaceKind | null
  entity: string | null
  district: number | null
  num: number | null
}

type DbRace = Awaited<ReturnType<typeof loadRaces>>[number]

interface CsvRaceGroup {
  title: string
  counties: Set<string>
  /** Combined votes per CSV candidate name (summed when a race spans counties). */
  candidates: Map<string, number>
}

interface PlannedUpdate {
  candidateId: string
  raceId: string
  candidateName: string
  csvName: string
  raceTitle: string
  officeType: OfficeType
  regionName: string
  voteCount: number
  votePercent: number
  /** undefined = leave the existing value untouched */
  elected: boolean | undefined
  shortTerm: boolean | undefined
  prev: {
    voteCount: number | null
    votePercent: number | null
    elected: boolean | null
    shortTerm: boolean
  }
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function usage(): never {
  console.error('Usage: npm run import:results -- <year> [--type primary|general] [--dry-run]')
  process.exit(1)
}

function parseArgs(): { year: number; type: ResultsElectionType; typeInferred: boolean } {
  const args = process.argv.slice(2)
  const positional = args.filter(arg => !arg.startsWith('--'))
  const year = Number.parseInt(positional[0], 10)

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    usage()
  }

  let rawType: string | undefined
  const flagIndex = args.findIndex(arg => arg === '--type' || arg.startsWith('--type='))
  if (flagIndex !== -1) {
    rawType = args[flagIndex].includes('=') ? args[flagIndex].split('=')[1] : args[flagIndex + 1]
    if (rawType !== 'primary' && rawType !== 'general') {
      usage()
    }
  }

  if (rawType) {
    return { year, type: rawType.toUpperCase() as ResultsElectionType, typeInferred: false }
  }

  // Infer from the calendar: through August of the election year assume the
  // primary; from September on (or for past years) assume the general.
  const now = new Date()
  const type: ResultsElectionType =
    year >= now.getFullYear() && now.getMonth() <= 7 ? 'PRIMARY' : 'GENERAL'

  return { year, type, typeInferred: true }
}

// ---------------------------------------------------------------------------
// Race descriptors: reduce wildly different race titles to comparable keys
// ---------------------------------------------------------------------------

function lastNumber(text: string): number | null {
  const matches = text.match(/\d+/g)
  return matches ? Number.parseInt(matches[matches.length - 1], 10) : null
}

function extractDistrict(text: string): number | null {
  const match = text.match(/(?:legislative|congressional) district (\d+)/)
  return match ? Number.parseInt(match[1], 10) : null
}

/**
 * Strip identifiers that would confuse position-number extraction: school
 * district numbers ("School District 17", "School District No. J-51") and
 * legislative/congressional district numbers.
 */
function stripDistrictIdentifiers(text: string): string {
  return text
    .replace(/school district\s*(?:no\.?\s*)?j?-?\d+/g, 'school district')
    .replace(/(?:legislative|congressional) district \d+/g, '')
}

function csvKind(title: string): RaceKind | null {
  if (/\bport of\b/.test(title)) return 'port'
  if (/school district/.test(title) && /director/.test(title)) return 'school'
  if (/\bmeasure\b|\bproposition\b|\bprop\b/.test(title)) return 'measure'
  if (/\bmayor\b/.test(title)) return 'mayor'
  if (/council/.test(title)) return 'council'
  if (/superior court/.test(title)) return 'judge'
  if (/state senator/.test(title)) return 'state-senator'
  if (/state representative/.test(title)) return 'state-rep'
  if (/u\.?s\.? senator/.test(title)) return 'us-senate'
  if (/u\.?s\.? representative|congressional district/.test(title)) return 'us-house'
  if (/sheriff/.test(title)) return 'sheriff'
  if (/prosecut/.test(title)) return 'prosecutor'
  if (/(?:benton|franklin)\s+(?:county\s+)?commissioner/.test(title)) return 'county-commissioner'
  return null
}

function csvEntity(title: string, kind: RaceKind | null): string | null {
  if (kind && STATE_KINDS.has(kind)) return 'state'
  if (kind === 'port') {
    const match = title.match(/port of ([a-z]+)/)
    return match ? match[1] : null
  }
  if (/west richland/.test(title)) return 'west richland'
  if (/benton city|kiona/.test(title)) return 'benton city'
  if (/richland/.test(title)) return 'richland'
  if (/kennewick/.test(title)) return 'kennewick'
  if (/pasco/.test(title)) return 'pasco'
  if (/benton/.test(title)) return 'benton'
  if (/franklin/.test(title)) return 'franklin'
  return null
}

function describeCsvRace(rawTitle: string): RaceDescriptor {
  const title = rawTitle.toLowerCase().replace(/#/g, '')
  const kind = csvKind(title)
  return {
    kind,
    entity: csvEntity(title, kind),
    district: extractDistrict(title),
    num: lastNumber(stripDistrictIdentifiers(title)),
  }
}

const OFFICE_TYPE_KIND: Record<OfficeType, RaceKind | null> = {
  CITY_COUNCIL: 'council',
  SCHOOL_BOARD: 'school',
  PORT_COMMISSIONER: 'port',
  BALLOT_MEASURE: 'measure',
  COUNTY_COMMISSIONER: 'county-commissioner',
  STATE_SENATOR: 'state-senator',
  STATE_REPRESENTATIVE: 'state-rep',
  SUPERIOR_COURT_JUDGE: 'judge',
  US_HOUSE: 'us-house',
  US_SENATE: 'us-senate',
  MAYOR: 'mayor',
  SHERIFF: 'sheriff',
  PROSECUTOR: 'prosecutor',
}

function describeDbRace(race: DbRace): RaceDescriptor {
  const title = race.office.title.toLowerCase().replace(/#/g, '')
  const kind = OFFICE_TYPE_KIND[race.office.type]

  let entity: string | null
  if (kind && STATE_KINDS.has(kind)) {
    entity = 'state'
  } else if (kind === 'port') {
    const match = title.match(/port of ([a-z]+)/)
    entity = match ? match[1] : null
  } else {
    entity = race.office.region.name.toLowerCase().replace(/ county$/, '')
  }

  const num =
    kind === 'measure'
      ? null
      : race.office.position ?? lastNumber(stripDistrictIdentifiers(title))

  return { kind, entity, district: extractDistrict(title), num }
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

async function loadRaces(electionYear: number, type: ElectionType) {
  return prisma.race.findMany({
    where: { electionYear, type },
    include: {
      office: { include: { region: true } },
      candidates: { include: { candidate: true } },
    },
  })
}

function groupCsvRows(rows: ResultRow[]): CsvRaceGroup[] {
  const groups = new Map<string, CsvRaceGroup>()

  for (const row of rows) {
    let group = groups.get(row.race)
    if (!group) {
      group = { title: row.race, counties: new Set(), candidates: new Map() }
      groups.set(row.race, group)
    }
    group.counties.add(row.county)
    // Sum across counties for races that span both (e.g. district-wide races)
    group.candidates.set(row.candidate, (group.candidates.get(row.candidate) ?? 0) + row.votes)
  }

  return Array.from(groups.values())
}

function matchDbRace(
  descriptor: RaceDescriptor,
  dbRaces: { race: DbRace; descriptor: RaceDescriptor }[]
): { race: DbRace | null; reason: 'matched' | 'unrecognized' | 'no-match' | 'ambiguous' } {
  if (!descriptor.kind || !descriptor.entity) {
    return { race: null, reason: 'unrecognized' }
  }

  let pool = dbRaces.filter(
    entry =>
      entry.descriptor.kind === descriptor.kind &&
      entry.descriptor.entity === descriptor.entity &&
      entry.race.candidates.length > 0
  )

  if (descriptor.district !== null) {
    pool = pool.filter(entry => entry.descriptor.district === descriptor.district)
  }

  if (descriptor.num !== null) {
    const exact = pool.filter(entry => entry.descriptor.num === descriptor.num)
    pool = exact.length > 0 ? exact : pool.filter(entry => entry.descriptor.num === null)
  } else if (pool.length > 1) {
    pool = pool.filter(entry => entry.descriptor.num === null)
  }

  if (pool.length === 1) {
    return { race: pool[0].race, reason: 'matched' }
  }
  return { race: null, reason: pool.length === 0 ? 'no-match' : 'ambiguous' }
}

function buildRaceMatcher(race: DbRace, namesConfig: NameConfigEntry[]): NameMatcher {
  const matcher = new NameMatcher()
  const idByName = new Map<string, string>()

  for (const cr of race.candidates) {
    idByName.set(cr.candidate.name, cr.candidateId)
    matcher.addKnownName(cr.candidate.name, cr.candidateId)
  }

  for (const entry of namesConfig) {
    const candidateId = idByName.get(entry.formattedName)
    if (!candidateId) continue
    for (const alt of entry.altNames ?? []) {
      matcher.addAlias(candidateId, alt)
    }
  }

  for (const [alias, canonical] of Object.entries(ADDITIONAL_CANDIDATE_ALIASES)) {
    const candidateId = idByName.get(canonical)
    if (candidateId) {
      matcher.addAlias(candidateId, alias)
    }
  }

  return matcher
}

function matchCandidate(race: DbRace, matcher: NameMatcher, csvName: string): string | null {
  // Ballot measures report "Yes"/"No" (or "Approved"/"Rejected") rather than
  // names; map by prefix against the measure's option records.
  if (race.office.type === OfficeType.BALLOT_MEASURE) {
    const normalized = csvName.trim().toLowerCase()
    const prefix =
      normalized === 'yes' || normalized === 'approved'
        ? 'yes'
        : normalized === 'no' || normalized === 'rejected'
          ? 'no'
          : null
    if (prefix) {
      const option = race.candidates.find(cr =>
        cr.candidate.name.toLowerCase().startsWith(prefix)
      )
      return option ? option.candidateId : null
    }
  }

  const match = matcher.findMatch(csvName)
  return match.source === 'none' ? null : match.normalizedName
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { year, type, typeInferred } = parseArgs()
  const electionType = type === 'PRIMARY' ? ElectionType.PRIMARY : ElectionType.GENERAL
  const dateCode = electionDateCode(year, type)
  const { message } = getOutputMode()
  const dryRun = isDryRun()

  console.log(message)
  console.log(
    `\n📥 Importing ${year} ${type} results (election date ${dateCode}${typeInferred ? ', type inferred — pass --type to override' : ''})`
  )

  const rows = (
    await Promise.all(COUNTIES.map(county => fetchCountyResults(dateCode, county)))
  ).flat()
  console.log(`   Fetched ${rows.length} result rows from ${COUNTIES.join(', ')}`)

  const races = await loadRaces(year, electionType)
  const dbRaces = races.map(race => ({ race, descriptor: describeDbRace(race) }))
  console.log(`   Found ${races.length} ${year} ${type} races in the database`)

  const namesConfig: NameConfigEntry[] = JSON.parse(fs.readFileSync(NAMES_CONFIG_PATH, 'utf8'))
  const groups = groupCsvRows(rows)

  const planned: PlannedUpdate[] = []
  const unrecognizedRaces: string[] = []
  const unmatchedRaces: string[] = []
  const ambiguousRaces: string[] = []
  const unmatchedCandidates: string[] = []
  const warnings: string[] = []
  const matchedRaceIds = new Map<string, string>() // raceId -> csv title

  for (const group of groups) {
    const descriptor = describeCsvRace(group.title)
    const { race, reason } = matchDbRace(descriptor, dbRaces)
    const label = `"${group.title}" (${Array.from(group.counties).join('+')}, ${group.candidates.size} rows)`

    if (!race) {
      if (reason === 'unrecognized') unrecognizedRaces.push(label)
      else if (reason === 'ambiguous') ambiguousRaces.push(label)
      else unmatchedRaces.push(label)
      continue
    }

    const previousTitle = matchedRaceIds.get(race.id)
    if (previousTitle) {
      ambiguousRaces.push(`${label} — db race "${race.office.title}" already matched by "${previousTitle}"`)
      continue
    }
    matchedRaceIds.set(race.id, group.title)

    const matcher = buildRaceMatcher(race, namesConfig)
    const totalVotes = Array.from(group.candidates.values()).reduce((sum, v) => sum + v, 0)

    // Candidate rows, write-ins excluded (they are not database candidates)
    const candidateRows = Array.from(group.candidates.entries())
      .filter(([name]) => !isWriteIn(name))
      .map(([name, votes]) => ({
        name,
        votes,
        candidateId: matchCandidate(race, matcher, name),
      }))
      .sort((a, b) => b.votes - a.votes)

    for (const row of candidateRows) {
      if (!row.candidateId) {
        unmatchedCandidates.push(
          `"${row.name}" (${row.votes} votes) in ${label} → db race "${race.office.title}" ` +
            `[candidates: ${race.candidates.map(cr => cr.candidate.name).join(', ')}]`
        )
      }
    }

    // Winner determination: general elections only; the top SEATS_PER_RACE
    // vote-getters win. Skip marking anyone if a top row is unmatched or a
    // write-in out-polled the top matched candidate.
    let electedIds: Set<string> | null = null
    if (type === 'GENERAL') {
      const topRows = candidateRows.slice(0, SEATS_PER_RACE)
      const writeInVotes = Math.max(
        0,
        ...Array.from(group.candidates.entries())
          .filter(([name]) => isWriteIn(name))
          .map(([, votes]) => votes)
      )
      if (topRows.length === 0 || topRows.some(row => !row.candidateId)) {
        warnings.push(`Not marking winners for ${label}: top vote-getter is unmatched`)
      } else if (writeInVotes > topRows[topRows.length - 1].votes) {
        warnings.push(`Not marking winners for ${label}: write-ins out-polled a top candidate`)
      } else {
        electedIds = new Set(topRows.map(row => row.candidateId as string))
      }
    }

    for (const row of candidateRows) {
      if (!row.candidateId) continue
      const cr = race.candidates.find(entry => entry.candidateId === row.candidateId)
      if (!cr) continue

      planned.push({
        candidateId: row.candidateId,
        raceId: race.id,
        candidateName: cr.candidate.name,
        csvName: row.name,
        raceTitle: race.office.title,
        officeType: race.office.type,
        regionName: race.office.region.name,
        voteCount: row.votes,
        votePercent: totalVotes > 0 ? Math.round((row.votes / totalVotes) * 10000) / 100 : 0,
        elected: electedIds ? electedIds.has(row.candidateId) : undefined,
        shortTerm: undefined,
        prev: {
          voteCount: cr.voteCount,
          votePercent: cr.votePercent,
          elected: cr.elected,
          shortTerm: cr.shortTerm,
        },
      })
    }
  }

  // Richland special rule: in odd-year generals the city council winner with
  // the fewest votes serves the short term (top vote-getters get full terms).
  if (type === 'GENERAL' && year % 2 === 1) {
    const richlandWinners = planned.filter(
      update =>
        update.elected === true &&
        update.officeType === OfficeType.CITY_COUNCIL &&
        update.regionName === 'Richland'
    )
    const shortTermWinner = pickShortTermWinner(richlandWinners)
    if (shortTermWinner) {
      for (const winner of richlandWinners) {
        winner.shortTerm = winner === shortTermWinner
      }
      console.log(
        `\n🏛  Richland short-term rule: ${shortTermWinner.candidateName} ` +
          `(${shortTermWinner.voteCount} votes — fewest among ${richlandWinners.length} council winners) gets the short term`
      )
    }
  }

  // -------------------------------------------------------------------------
  // Report planned changes
  // -------------------------------------------------------------------------
  console.log(`\n📊 Planned updates (${planned.length} candidates):`)
  const byRace = new Map<string, PlannedUpdate[]>()
  for (const update of planned) {
    const list = byRace.get(update.raceTitle) ?? []
    list.push(update)
    byRace.set(update.raceTitle, list)
  }

  for (const [raceTitle, updates] of Array.from(byRace.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    console.log(`\n  ${raceTitle}`)
    for (const u of updates.sort((a, b) => b.voteCount - a.voteCount)) {
      const marker = u.elected === true ? ' ✓ elected' : ''
      const short = u.shortTerm === true ? ' (short term)' : ''
      const changes: string[] = []
      if (u.prev.voteCount !== u.voteCount) changes.push(`votes ${u.prev.voteCount} → ${u.voteCount}`)
      if (u.prev.votePercent !== u.votePercent) changes.push(`pct ${u.prev.votePercent} → ${u.votePercent}`)
      if (u.elected !== undefined && u.prev.elected !== u.elected) changes.push(`elected ${u.prev.elected} → ${u.elected}`)
      if (u.shortTerm !== undefined && u.prev.shortTerm !== u.shortTerm) changes.push(`shortTerm ${u.prev.shortTerm} → ${u.shortTerm}`)
      console.log(
        `    ${u.candidateName.padEnd(28)} ${String(u.voteCount).padStart(7)}  ${u.votePercent.toFixed(2).padStart(6)}%${marker}${short}` +
          (changes.length > 0 ? `  [${changes.join(', ')}]` : '  [no change]')
      )
    }
  }

  const coveredRaces = new Set(planned.map(update => update.raceId))
  const missingResults = races.filter(
    race => race.candidates.length > 0 && !coveredRaces.has(race.id)
  )

  console.log(`\n📈 Summary:`)
  console.log(`   CSV races: ${groups.length} (${unrecognizedRaces.length} outside our coverage)`)
  console.log(`   Races matched to database: ${matchedRaceIds.size}`)
  console.log(`   Candidate results matched: ${planned.length}`)
  console.log(`   Candidate rows unmatched: ${unmatchedCandidates.length}`)
  if (missingResults.length > 0) {
    console.log(`   ⚠️  Database races with candidates but no results:`)
    for (const race of missingResults) {
      console.log(`      - ${race.office.title} (${race.office.region.name})`)
    }
  }
  for (const warning of warnings) {
    console.log(`   ⚠️  ${warning}`)
  }

  // -------------------------------------------------------------------------
  // Review file for anything unmatched
  // -------------------------------------------------------------------------
  const reviewSections: string[] = []
  if (unmatchedCandidates.length > 0) {
    reviewSections.push(`## Unmatched candidates in matched races\n${unmatchedCandidates.map(line => `- ${line}`).join('\n')}`)
  }
  if (ambiguousRaces.length > 0) {
    reviewSections.push(`## Ambiguous race matches\n${ambiguousRaces.map(line => `- ${line}`).join('\n')}`)
  }
  if (unmatchedRaces.length > 0) {
    reviewSections.push(`## Recognized races with no database match\n${unmatchedRaces.map(line => `- ${line}`).join('\n')}`)
  }
  if (unrecognizedRaces.length > 0) {
    reviewSections.push(`## Races outside our coverage (no jurisdiction/office mapping)\n${unrecognizedRaces.map(line => `- ${line}`).join('\n')}`)
  }

  if (reviewSections.length > 0) {
    const header = `# Unmatched election results — ${dateCode} (${year} ${type})\n# Review manually; nothing here was imported.\n`
    fs.writeFileSync(UNMATCHED_PATH, `${header}\n${reviewSections.join('\n\n')}\n`, 'utf8')
    console.log(`\n📝 Review file written: ${path.relative(process.cwd(), UNMATCHED_PATH)}`)
  } else if (fs.existsSync(UNMATCHED_PATH)) {
    fs.unlinkSync(UNMATCHED_PATH)
  }

  // -------------------------------------------------------------------------
  // Write
  // -------------------------------------------------------------------------
  if (dryRun) {
    console.log('\n🔒 Dry run complete — no database changes made. Set IMPORT_MODE=db to write.')
    return
  }

  console.log('\n💾 Writing results to database...')
  let written = 0
  for (const update of planned) {
    await prisma.candidateRace.update({
      where: {
        candidateId_raceId: { candidateId: update.candidateId, raceId: update.raceId },
      },
      data: {
        voteCount: update.voteCount,
        votePercent: update.votePercent,
        ...(update.elected !== undefined ? { elected: update.elected } : {}),
        ...(update.shortTerm !== undefined ? { shortTerm: update.shortTerm } : {}),
      },
    })
    written++
  }
  console.log(`✅ Updated ${written} CandidateRace records`)
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

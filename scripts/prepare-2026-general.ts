#!/usr/bin/env ts-node
/**
 * Build the 2026 general-election ballot from the certified primary.
 *
 * Usage:
 *   ts-node --project tsconfig.scripts.json scripts/prepare-2026-general.ts [--dry-run]
 *
 * Dry run by default; set IMPORT_MODE=db to write.
 *
 * For every 2026 primary race this creates the matching general race, carries
 * the candidates who advanced onto it, and attaches it to the general guide of
 * each region whose primary guide held it — so a race on both county ballots
 * stays on both.
 *
 * Who advances:
 * - A race with vote counts sends its top two vote-getters (Washington's
 *   top-two primary, RCW 29A.52.112). A single filer sends that one candidate.
 * - A race with NO vote counts never appeared on the primary ballot: Washington
 *   omits a nonpartisan office with two or fewer filers (RCW 29A.52.220), so
 *   every candidate on it advances. Eleven 2026 races are in this state,
 *   including four genuinely contested ones — the district court judgeships,
 *   Benton PUD, and Supreme Court Position 4.
 *
 * Nobody is invented: every November candidate already exists as a 2026
 * candidate, because the primary field is where they were filed. Candidates who
 * withdrew before the ballot was set were never imported.
 *
 * Re-running is safe. Races, candidate links and guides are matched on what
 * identifies them and created only when absent, and a general race whose
 * advancing set has changed is corrected rather than duplicated.
 */
import { ElectionType, PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { getOutputMode, isDryRun } from './import/config'

dotenv.config()

const prisma = new PrismaClient()

const YEAR = 2026
/** Washington's top-two primary sends two candidates to the general. */
const ADVANCE_COUNT = 2

type PrimaryRace = Awaited<ReturnType<typeof loadPrimaryRaces>>[number]

async function loadPrimaryRaces() {
  return prisma.race.findMany({
    where: { electionYear: YEAR, type: ElectionType.PRIMARY },
    include: {
      office: { include: { region: true } },
      Guide: { include: { region: true } },
      candidates: { include: { candidate: true } },
    },
  })
}

interface Advancement {
  race: PrimaryRace
  /** Candidate ids advancing, in finishing order. */
  advancing: string[]
  reason: 'top-two' | 'no-primary-held'
}

/**
 * Who goes on the November ballot from one primary race.
 *
 * Hidden candidates are left out: `hide` is the editorial switch for a record
 * that should not be shown, and a hidden candidate is not a ballot line.
 */
function resolveAdvancement(race: PrimaryRace): Advancement {
  const visible = race.candidates.filter(cr => !cr.candidate.hide)
  const counted = visible.filter(cr => cr.voteCount !== null)

  if (counted.length === 0) {
    return { race, advancing: visible.map(cr => cr.candidateId), reason: 'no-primary-held' }
  }

  const ranked = [...counted].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
  return {
    race,
    advancing: ranked.slice(0, ADVANCE_COUNT).map(cr => cr.candidateId),
    reason: 'top-two',
  }
}

async function ensureGeneralGuide(regionId: string, regionName: string, dryRun: boolean) {
  const existing = await prisma.guide.findFirst({
    where: { electionYear: YEAR, regionId, type: ElectionType.GENERAL },
  })
  if (existing) return existing.id

  console.log(`  + general guide for ${regionName}`)
  if (dryRun) return null

  const created = await prisma.guide.create({
    data: { electionYear: YEAR, regionId, type: ElectionType.GENERAL },
  })
  return created.id
}

async function main() {
  const dryRun = isDryRun()
  console.log(getOutputMode().message)
  console.log(`\n🗳  Building the ${YEAR} general ballot from the certified primary\n`)

  const primaryRaces = await loadPrimaryRaces()
  console.log(`   ${primaryRaces.length} primary races to carry forward\n`)

  // General guides, one per region that has a primary guide.
  const primaryGuides = await prisma.guide.findMany({
    where: { electionYear: YEAR, type: ElectionType.PRIMARY },
    include: { region: true },
  })
  const generalGuideByRegionId = new Map<string, string | null>()
  console.log('Guides:')
  for (const guide of primaryGuides) {
    generalGuideByRegionId.set(
      guide.regionId,
      await ensureGeneralGuide(guide.regionId, guide.region.name, dryRun)
    )
  }

  const contested: string[] = []
  const uncontested: string[] = []
  const noPrimary: string[] = []
  let racesCreated = 0
  let linksCreated = 0

  console.log('\nRaces:')
  for (const race of primaryRaces.sort((a, b) => a.office.title.localeCompare(b.office.title))) {
    if (race.hide) {
      console.log(`  – ${race.office.title} — primary race is hidden, skipped`)
      continue
    }

    const { advancing, reason } = resolveAdvancement(race)

    if (advancing.length === 0) {
      console.log(`  ! ${race.office.title} — no candidates to advance, skipped`)
      continue
    }

    const names = advancing.map(
      id => race.candidates.find(cr => cr.candidateId === id)?.candidate.name ?? id
    )
    const label = `${race.office.title} (${race.office.region.name})`
    const line = `${label}: ${names.join(', ')}`
    if (reason === 'no-primary-held') noPrimary.push(line)
    else if (advancing.length > 1) contested.push(line)
    else uncontested.push(line)

    let general = await prisma.race.findFirst({
      where: { electionYear: YEAR, officeId: race.officeId, type: ElectionType.GENERAL },
      include: { candidates: true, Guide: true },
    })

    if (!general) {
      console.log(`  + ${label} — ${names.join(', ')}${reason === 'no-primary-held' ? '  [no primary held]' : ''}`)
      racesCreated++
      if (!dryRun) {
        general = await prisma.race.create({
          data: { electionYear: YEAR, officeId: race.officeId, type: ElectionType.GENERAL },
          include: { candidates: true, Guide: true },
        })
      }
    } else {
      console.log(`  = ${label} — general race exists`)
    }

    if (!general) continue

    // Candidate links: add whoever advanced, carrying incumbency and party
    // from the primary; drop anyone no longer advancing.
    for (const candidateId of advancing) {
      if (general.candidates.some(cr => cr.candidateId === candidateId)) continue
      const source = race.candidates.find(cr => cr.candidateId === candidateId)
      linksCreated++
      if (!dryRun) {
        await prisma.candidateRace.create({
          data: {
            candidateId,
            raceId: general.id,
            incumbent: source?.incumbent ?? false,
            party: source?.party ?? null,
            termLength: source?.termLength ?? null,
          },
        })
      }
    }

    for (const link of general.candidates) {
      if (advancing.includes(link.candidateId)) continue
      const name =
        race.candidates.find(cr => cr.candidateId === link.candidateId)?.candidate.name ??
        link.candidateId
      console.log(`    - removing ${name} — did not advance`)
      if (!dryRun) {
        await prisma.candidateRace.delete({
          where: { candidateId_raceId: { candidateId: link.candidateId, raceId: general.id } },
        })
      }
    }

    // Guide membership mirrors the primary's, so a race on both county ballots
    // stays on both.
    const guideIds = race.Guide.map(g => generalGuideByRegionId.get(g.regionId)).filter(
      (id): id is string => Boolean(id)
    )
    if (guideIds.length > 0 && !dryRun) {
      await prisma.race.update({
        where: { id: general.id },
        data: { Guide: { set: guideIds.map(id => ({ id })) } },
      })
    }
  }

  console.log(`\n📋 November ${YEAR} ballot`)
  console.log(`\n  Contested (${contested.length}):`)
  for (const line of contested.sort()) console.log(`    ${line}`)
  console.log(`\n  No primary held — two or fewer filers (${noPrimary.length}):`)
  for (const line of noPrimary.sort()) console.log(`    ${line}`)
  console.log(`\n  Unopposed (${uncontested.length}):`)
  for (const line of uncontested.sort()) console.log(`    ${line}`)

  console.log(`\n📈 ${racesCreated} general races created, ${linksCreated} candidate links created`)

  if (dryRun) {
    console.log('\n🔒 Dry run complete — nothing written. Set IMPORT_MODE=db to write.')
  } else {
    console.log('\n✅ Written.')
  }
}

main()
  .catch(error => {
    console.error(`❌ Failed to prepare the ${YEAR} general ballot:`, error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

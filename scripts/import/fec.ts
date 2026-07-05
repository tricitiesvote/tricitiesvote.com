#!/usr/bin/env ts-node
// FEC campaign-finance import for federal (U.S. House) candidates.
//
// State/local candidates report to the WA PDC (see pdc-fast.ts); federal
// candidates file with the FEC instead. This script mirrors the PDC import:
// batch delete-then-insert of Contribution rows plus a donor-summary string
// on the candidate, but sources data from the official FEC API
// (https://api.open.fec.gov/developers/).
//
// Usage:
//   npx ts-node --project tsconfig.scripts.json scripts/import/fec.ts 2026 [flags]
//
// Flags:
//   --refresh-map   Re-resolve FEC candidate ids even if the mapping JSON exists
//   --limit N       Only fetch money for the first N mapped candidates (rate-limit budgeting)
//   --map-only      Resolve/refresh the candidate mapping and exit (no money fetches)
//
// Dry-run by default: prints per-candidate totals and row counts, writes nothing.
// Set IMPORT_MODE=db to write to the database.
//
// API key: env FEC_API_KEY, falling back to DEMO_KEY (30 req/hr, 50 req/day
// per IP -- fine for resolving the candidate map, too small for a full run).

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { NameMatcher } from '../../lib/normalize/names'

const prisma = new PrismaClient()

const FEC_API_BASE = 'https://api.open.fec.gov/v1'
const API_KEY = process.env.FEC_API_KEY || 'DEMO_KEY'
const IMPORT_MODE = process.env.IMPORT_MODE === 'db'
const SCHEDULE_A_PER_PAGE = 100
const MAX_SCHEDULE_A_PAGES = 50 // safety cap: 5,000 itemized receipts per candidate

let requestCount = 0

interface FecMappingEntry {
  dbId: string
  dbName: string
  district: string
  fecCandidateId: string
  fecName: string
  committeeId: string | null
  committeeName: string | null
  matchSource: 'exact' | 'fuzzy'
  matchConfidence: number
}

interface FecMappingFile {
  cycle: number
  generatedAt: string
  matched: FecMappingEntry[]
  unmatchedDb: Array<{ dbId: string; dbName: string; district: string; reason: string }>
  unmatchedFec: Array<{ fecCandidateId: string; fecName: string; district: string; reason: string }>
}

interface ContributionRow {
  id: string
  candidateId: string
  electionYear: number
  donorName: string
  donorCity: string | null
  donorState: string | null
  donorZip: string | null
  donorEmployer: string | null
  donorOccupation: string | null
  amount: number
  date: Date
  description: string | null
  cashOrInKind: string
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fecGet(endpoint: string, params: Record<string, string | string[]>): Promise<any> {
  const url = new URL(`${FEC_API_BASE}${endpoint}`)
  url.searchParams.set('api_key', API_KEY)
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, v)
    } else {
      url.searchParams.set(key, value)
    }
  }

  const backoffs = [5000, 20000, 60000]
  for (let attempt = 0; ; attempt++) {
    requestCount++
    const res = await fetch(url.toString())
    if (res.status === 429) {
      if (attempt >= backoffs.length) {
        throw new Error(
          `FEC API rate limit (429) persisted after ${backoffs.length} retries on ${endpoint}. ` +
          (API_KEY === 'DEMO_KEY'
            ? 'DEMO_KEY allows 30 req/hr and 50 req/day per IP; set FEC_API_KEY for a real key (1,000 req/hr).'
            : 'Wait and rerun; the candidate mapping is cached so reruns are cheap.')
        )
      }
      const retryAfter = res.headers.get('retry-after')
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : backoffs[attempt]
      // A retry-after beyond a few minutes means the key's hourly/daily quota
      // is spent — waiting in-process is pointless, so stop with guidance.
      if (waitMs > 5 * 60 * 1000) {
        throw new Error(
          `FEC API quota exhausted (retry-after ${Math.round(waitMs / 1000)}s) on ${endpoint}. ` +
          (API_KEY === 'DEMO_KEY'
            ? 'DEMO_KEY allows 30 req/hr and 50 req/day per IP; set FEC_API_KEY for a real key (1,000 req/hr).'
            : 'Rerun after the quota window resets; the candidate mapping is cached so reruns are cheap.')
        )
      }
      console.log(`  Rate limited (429) on ${endpoint}; waiting ${Math.round(waitMs / 1000)}s...`)
      await sleep(waitMs)
      continue
    }
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`FEC API ${res.status} on ${endpoint}: ${body.slice(0, 300)}`)
    }
    return res.json()
  }
}

// FEC names are "LAST, FIRST MIDDLE [SUFFIX]"; reorder to "FIRST MIDDLE LAST".
function reorderFecName(name: string): string {
  const parts = name.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) return name.trim()
  return `${parts.slice(1).join(' ')} ${parts[0]}`
}

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v', 'mr', 'mrs', 'ms', 'dr'])

// Common first-name nicknames <-> formal names (FEC filings usually use the
// formal name, e.g. "BOEHNKE, MATTHEW" for DB name "Matt Boehnke").
const NICKNAMES: Record<string, string[]> = {
  matt: ['matthew'],
  mike: ['michael'],
  dan: ['daniel'],
  dave: ['david'],
  jack: ['john'],
  ken: ['kenneth'],
  zac: ['zachary'],
  rich: ['richard'],
  rick: ['richard'],
  kevin: [],
  andy: ['andrew'],
  tom: ['thomas'],
  jim: ['james'],
  bob: ['robert'],
  bill: ['william'],
  liz: ['elizabeth']
}

function stripSuffixes(name: string): string {
  return name
    .split(/\s+/)
    .filter(tok => !SUFFIXES.has(tok.toLowerCase().replace(/\./g, '')))
    .join(' ')
}

// Variants of a DB name to seed the matcher with: as-is, without quoted
// nickname, nickname-in-place-of-first-name, and first+last only.
function dbNameVariants(name: string): string[] {
  const variants = new Set<string>()
  variants.add(name)

  const nickMatch = name.match(/["“‘']([^"“”‘’']+)["”’']/)
  const noNick = name.replace(/["“‘']([^"“”‘’']+)["”’']/g, ' ').replace(/\s+/g, ' ').trim()
  variants.add(noNick)

  const tokens = stripSuffixes(noNick).split(/\s+/).filter(Boolean)
  if (tokens.length > 2) {
    variants.add(`${tokens[0]} ${tokens[tokens.length - 1]}`)
  }
  if (nickMatch && tokens.length >= 2) {
    variants.add(`${nickMatch[1]} ${tokens[tokens.length - 1]}`)
  }
  // Expand first-name nicknames to their formal forms
  if (tokens.length >= 2) {
    const first = tokens[0].toLowerCase()
    for (const formal of NICKNAMES[first] || []) {
      variants.add(`${formal} ${tokens.slice(1).join(' ')}`)
      variants.add(`${formal} ${tokens[tokens.length - 1]}`)
    }
  }
  return Array.from(variants)
}

// Candidate forms of an FEC name to try against the matcher, most specific first.
function fecNameCandidates(fecName: string): string[] {
  const reordered = reorderFecName(fecName)
  const stripped = stripSuffixes(reordered)
  const candidates = [reordered, stripped]
  const tokens = stripped.split(/\s+/).filter(Boolean)
  if (tokens.length > 2) {
    candidates.push(`${tokens[0]} ${tokens[tokens.length - 1]}`)
  }
  return Array.from(new Set(candidates))
}

// "U.S. House District 4" -> "04"
function districtFromOfficeTitle(title: string): string | null {
  const m = title.match(/District\s+(\d+)/i)
  if (!m) return null
  return m[1].padStart(2, '0')
}

async function resolveCandidateMap(year: number, mapPath: string): Promise<FecMappingFile> {
  const dbCandidates = await prisma.candidate.findMany({
    where: { electionYear: year, office: { title: { contains: 'U.S. House' } } },
    select: { id: true, name: true, office: { select: { title: true } } },
    orderBy: { name: 'asc' }
  })
  console.log(`Found ${dbCandidates.length} U.S. House candidates in DB for ${year}`)

  const districts = new Set<string>()
  const dbByName = new Map<string, { id: string; name: string; district: string }>()
  const matcher = new NameMatcher()

  for (const c of dbCandidates) {
    const district = districtFromOfficeTitle(c.office.title)
    if (!district) {
      console.log(`  WARNING: could not parse district from office "${c.office.title}" for ${c.name}`)
      continue
    }
    districts.add(district)
    dbByName.set(c.name, { id: c.id, name: c.name, district })
    for (const variant of dbNameVariants(c.name)) {
      matcher.addKnownName(variant, c.name)
    }
  }

  interface FecSearchResult {
    candidate_id: string
    name: string
    district: string
    committeeId: string | null
    committeeName: string | null
  }

  const fecResults: FecSearchResult[] = []
  for (const district of Array.from(districts).sort()) {
    console.log(`Searching FEC candidates: office=H state=WA district=${district} cycle=${year}`)
    const data = await fecGet('/candidates/search/', {
      office: 'H',
      state: 'WA',
      district,
      cycle: String(year),
      per_page: '100'
    })
    for (const r of data.results || []) {
      const principal = (r.principal_committees || []).find((pc: any) => pc.designation === 'P')
        || (r.principal_committees || [])[0]
      fecResults.push({
        candidate_id: r.candidate_id,
        name: r.name,
        district,
        committeeId: principal?.committee_id || null,
        committeeName: principal?.name || null
      })
    }
  }
  console.log(`FEC search returned ${fecResults.length} candidates across districts ${Array.from(districts).sort().join(', ')}`)

  const matched: FecMappingEntry[] = []
  const unmatchedFec: FecMappingFile['unmatchedFec'] = []
  const claimedDb = new Map<string, FecMappingEntry>()

  for (const fec of fecResults) {
    let best: { dbName: string; confidence: number; source: 'exact' | 'fuzzy' } | null = null
    for (const candidateName of fecNameCandidates(fec.name)) {
      const result = matcher.findMatch(candidateName)
      if (result.source === 'none') continue
      if (!best || result.confidence > best.confidence) {
        best = { dbName: result.normalizedName, confidence: result.confidence, source: result.source }
      }
      if (result.source === 'exact') break
    }

    if (!best) {
      unmatchedFec.push({
        fecCandidateId: fec.candidate_id,
        fecName: fec.name,
        district: fec.district,
        reason: 'no DB candidate matched (exact or fuzzy >= 0.85)'
      })
      continue
    }

    const db = dbByName.get(best.dbName)
    if (!db || db.district !== fec.district) {
      unmatchedFec.push({
        fecCandidateId: fec.candidate_id,
        fecName: fec.name,
        district: fec.district,
        reason: `matched "${best.dbName}" but district mismatch`
      })
      continue
    }

    const existing = claimedDb.get(db.id)
    if (existing) {
      // Higher confidence wins; on a tie (e.g. the same person with two FEC
      // candidate ids), prefer the record that has a principal committee.
      const newWins = best.confidence > existing.matchConfidence
        || (best.confidence === existing.matchConfidence && !existing.committeeId && !!fec.committeeId)
      if (!newWins) {
        unmatchedFec.push({
          fecCandidateId: fec.candidate_id,
          fecName: fec.name,
          district: fec.district,
          reason: `conflict: DB candidate "${db.name}" already matched to ${existing.fecCandidateId} (${existing.fecName})`
        })
        continue
      }
      // New match is stronger; demote the previous one
      unmatchedFec.push({
        fecCandidateId: existing.fecCandidateId,
        fecName: existing.fecName,
        district: existing.district,
        reason: `conflict: DB candidate "${db.name}" matched better by ${fec.candidate_id} (${fec.name})`
      })
      matched.splice(matched.indexOf(existing), 1)
    }

    const entry: FecMappingEntry = {
      dbId: db.id,
      dbName: db.name,
      district: fec.district,
      fecCandidateId: fec.candidate_id,
      fecName: fec.name,
      committeeId: fec.committeeId,
      committeeName: fec.committeeName,
      matchSource: best.source,
      matchConfidence: Math.round(best.confidence * 1000) / 1000
    }
    claimedDb.set(db.id, entry)
    matched.push(entry)
  }

  const unmatchedDb = Array.from(dbByName.values())
    .filter(db => !claimedDb.has(db.id))
    .map(db => ({
      dbId: db.id,
      dbName: db.name,
      district: db.district,
      reason: 'no FEC candidate matched (may not have filed FEC Form 2 yet)'
    }))

  const mapping: FecMappingFile = {
    cycle: year,
    generatedAt: new Date().toISOString(),
    matched: matched.sort((a, b) => a.district.localeCompare(b.district) || a.dbName.localeCompare(b.dbName)),
    unmatchedDb,
    unmatchedFec
  }

  fs.writeFileSync(mapPath, JSON.stringify(mapping, null, 2) + '\n')
  console.log(`Wrote candidate mapping to ${mapPath}`)
  return mapping
}

function printMapping(mapping: FecMappingFile) {
  console.log(`\n=== Candidate mapping (cycle ${mapping.cycle}) ===`)
  console.log(`Matched: ${mapping.matched.length}`)
  for (const m of mapping.matched) {
    const committee = m.committeeId ? `${m.committeeId}` : 'NO COMMITTEE'
    console.log(`  WA-${m.district} ${m.dbName} -> ${m.fecCandidateId} (${m.fecName}) committee=${committee} [${m.matchSource} ${m.matchConfidence}]`)
  }
  if (mapping.unmatchedDb.length) {
    console.log(`Unmatched DB candidates: ${mapping.unmatchedDb.length}`)
    for (const u of mapping.unmatchedDb) {
      console.log(`  WA-${u.district} ${u.dbName}: ${u.reason}`)
    }
  }
  if (mapping.unmatchedFec.length) {
    console.log(`Unmatched FEC candidates: ${mapping.unmatchedFec.length}`)
    for (const u of mapping.unmatchedFec) {
      console.log(`  WA-${u.district} ${u.fecName} (${u.fecCandidateId}): ${u.reason}`)
    }
  }
}

async function fetchTotalReceipts(fecCandidateId: string, year: number): Promise<number> {
  const data = await fecGet(`/candidate/${fecCandidateId}/totals/`, {
    cycle: String(year),
    election_full: 'false',
    per_page: '10'
  })
  const row = (data.results || [])[0]
  return row ? Number(row.receipts) || 0 : 0
}

async function fetchScheduleA(committeeId: string, candidateId: string, year: number): Promise<ContributionRow[]> {
  const rows: ContributionRow[] = []
  let lastIndexes: Record<string, string> | null = null

  for (let page = 0; page < MAX_SCHEDULE_A_PAGES; page++) {
    const params: Record<string, string> = {
      committee_id: committeeId,
      two_year_transaction_period: String(year),
      is_individual: 'true',
      sort: '-contribution_receipt_date',
      per_page: String(SCHEDULE_A_PER_PAGE)
    }
    if (lastIndexes) {
      for (const [k, v] of Object.entries(lastIndexes)) {
        if (v !== null && v !== undefined) params[k] = String(v)
      }
    }

    const data = await fecGet('/schedules/schedule_a/', params)
    const results = data.results || []
    if (results.length === 0) break

    for (const r of results) {
      const amount = Number(r.contribution_receipt_amount) || 0
      if (amount <= 0) continue // skip refunds/corrections
      const date = r.contribution_receipt_date ? new Date(r.contribution_receipt_date) : null
      if (!date || isNaN(date.getTime())) continue
      rows.push({
        id: `fec-${r.sub_id}`,
        candidateId,
        electionYear: year,
        donorName: r.contributor_name || 'Unknown',
        donorCity: r.contributor_city || null,
        donorState: r.contributor_state || null,
        donorZip: r.contributor_zip || null,
        donorEmployer: r.contributor_employer || null,
        donorOccupation: r.contributor_occupation || null,
        amount,
        date,
        description: r.memo_text || null,
        cashOrInKind: 'cash'
      })
    }

    const li = data.pagination?.last_indexes
    if (!li || !li.last_index || results.length < SCHEDULE_A_PER_PAGE) break
    lastIndexes = li
    if (page === MAX_SCHEDULE_A_PAGES - 1) {
      console.log(`  WARNING: hit ${MAX_SCHEDULE_A_PAGES}-page cap for committee ${committeeId}; itemized rows truncated`)
    }
  }
  return rows
}

async function writeCandidateData(entry: FecMappingEntry, year: number, rows: ContributionRow[], totalReceipts: number, uniqueDonors: number) {
  // Idempotent: replace all FEC-sourced rows for this candidate, leave PDC rows alone
  await prisma.$transaction([
    prisma.contribution.deleteMany({
      where: { candidateId: entry.dbId, electionYear: year, id: { startsWith: 'fec-' } }
    }),
    prisma.contribution.createMany({ data: rows, skipDuplicates: true })
  ])

  // Same summary format as pdc-fast.ts, but total from FEC candidate totals
  // (includes unitemized small-dollar receipts Schedule A misses); itemized
  // distinct-donor count is a floor, hence "N+".
  const total = totalReceipts > 0 ? totalReceipts : rows.reduce((sum, r) => sum + r.amount, 0)
  const donorSummary = `Reported raised $${Math.round(total)} from ${uniqueDonors}+ donors`
  await prisma.candidate.update({
    where: { id: entry.dbId },
    data: { donors: donorSummary }
  })
}

async function main() {
  const args = process.argv.slice(2)
  const flags = new Set(args.filter(a => a.startsWith('--')))
  const positional = args.filter(a => !a.startsWith('--'))
  const year = parseInt(positional[0])

  if (!year || isNaN(year)) {
    console.log('Usage: npx ts-node --project tsconfig.scripts.json scripts/import/fec.ts <year> [--refresh-map] [--map-only] [--limit N]')
    process.exit(1)
  }

  let limit = Infinity
  const limitIdx = args.indexOf('--limit')
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1])
    if (isNaN(limit)) limit = Infinity
  }

  if (API_KEY === 'DEMO_KEY') {
    console.log('WARNING: no FEC_API_KEY in env; using DEMO_KEY (30 requests/hour, 50/day per IP).')
    console.log('         Sign up at https://api.open.fec.gov/developers/ for 1,000 req/hr.')
  }
  console.log(IMPORT_MODE
    ? 'IMPORT_MODE=db: writing to database'
    : 'DRY RUN: no database writes (set IMPORT_MODE=db to import)')

  const mapPath = path.join(__dirname, `fec-candidates-${year}.json`)

  let mapping: FecMappingFile
  if (fs.existsSync(mapPath) && !flags.has('--refresh-map')) {
    mapping = JSON.parse(fs.readFileSync(mapPath, 'utf-8'))
    console.log(`Loaded cached candidate mapping from ${mapPath} (generated ${mapping.generatedAt}); use --refresh-map to re-resolve`)
  } else {
    mapping = await resolveCandidateMap(year, mapPath)
  }
  printMapping(mapping)

  if (flags.has('--map-only')) {
    console.log(`\nMap-only run complete. FEC API requests used: ${requestCount}`)
    return
  }

  const toProcess = mapping.matched.slice(0, limit)
  if (toProcess.length < mapping.matched.length) {
    console.log(`\n--limit ${limit}: processing ${toProcess.length} of ${mapping.matched.length} matched candidates`)
  }

  console.log(`\n=== Money (cycle ${year}) ===`)
  let grandTotal = 0
  let grandRows = 0

  for (const entry of toProcess) {
    const totalReceipts = await fetchTotalReceipts(entry.fecCandidateId, year)

    let rows: ContributionRow[] = []
    if (entry.committeeId) {
      rows = await fetchScheduleA(entry.committeeId, entry.dbId, year)
    } else {
      console.log(`  NOTE: ${entry.dbName} has no principal committee; skipping itemized receipts`)
    }

    const uniqueDonors = new Set(rows.map(r => r.donorName)).size
    const itemizedTotal = rows.reduce((sum, r) => sum + r.amount, 0)
    const hasMoney = totalReceipts > 0 || rows.length > 0

    console.log(`WA-${entry.district} ${entry.dbName} (${entry.fecCandidateId}):`)
    console.log(`  total receipts: $${totalReceipts.toFixed(2)} | itemized: ${rows.length} rows / $${itemizedTotal.toFixed(2)} / ${uniqueDonors} unique donors`)

    if (!hasMoney) {
      console.log('  no FEC money reported; leaving candidate untouched')
      continue
    }

    const total = totalReceipts > 0 ? totalReceipts : itemizedTotal
    console.log(`  donor summary: "Reported raised $${Math.round(total)} from ${uniqueDonors}+ donors"`)
    grandTotal += total
    grandRows += rows.length

    if (IMPORT_MODE) {
      await writeCandidateData(entry, year, rows, totalReceipts, uniqueDonors)
      console.log(`  wrote ${rows.length} contribution rows + donor summary`)
    }
  }

  console.log(`\nDone. ${toProcess.length} candidates, ${grandRows} itemized rows, $${Math.round(grandTotal)} total receipts.`)
  console.log(`FEC API requests used: ${requestCount}`)
  if (!IMPORT_MODE) {
    console.log('Dry run complete -- nothing written. Set IMPORT_MODE=db to import.')
  }
}

if (require.main === module) {
  main()
    .catch(error => {
      console.error('Import failed:', error)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}

#!/usr/bin/env node
/**
 * Bootstrap the August 4, 2026 primary ballot: offices, races, candidates,
 * and guide links.
 *
 * Sources:
 * - legacy/data/json/load-config-election-2026-draft.json is the source of
 *   truth for WHICH races are on the ballot (electionId 898 + raceIds).
 *   RACE_DEFS below maps each raceId to an office definition; the script
 *   refuses to run if the config and RACE_DEFS drift apart.
 * - Candidate rosters are fetched live from VoteWA candidate.ashx (the WA
 *   SOS candidate list backing the config's `_races` notes). The notes only
 *   embed partial rosters, and filings change, so the live list wins.
 * - PDC filer IDs come from the kv7h-kjye Socrata dataset. Each race
 *   declares the PDC context (office / county / legislative district /
 *   jurisdiction) a filer must match before name matching is attempted, so
 *   stale filings for other seats (see IGNORED_FILER_IDS) cannot attach.
 *
 * SAFETY: dry-run by default; prints the full plan and writes nothing.
 * Set IMPORT_MODE=db to persist. Idempotent: reruns find existing rows.
 *
 * Prerequisite: `npm run prepare:2026` must have created the 2026 regions
 * and the Benton/Franklin PRIMARY guides.
 *
 * OfficeType approximations (the enum has no exact values for these; the
 * per-race table below makes them explicit and easy to change):
 * - County row officers (Assessor/Auditor/Clerk/Coroner/Treasurer)
 *   -> COUNTY_COMMISSIONER (county-level elected office)
 * - District Court / Supreme Court / Court of Appeals -> SUPERIOR_COURT_JUDGE
 * - PUD Commissioner -> PORT_COMMISSIONER (special-district commissioner)
 * Note: lib/officeDisplay.ts splitOffice() will mislabel breadcrumbs for
 * these approximated types until it (or the enum) is extended.
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { PrismaClient, OfficeType } from '@prisma/client'
import { NameMatcher } from '../../lib/normalize/names'

const prisma = new PrismaClient()

const ELECTION_YEAR = 2026
const ELECTION_TYPE = 'PRIMARY' as const
const CONFIG_PATH = path.join(
  __dirname,
  '../../legacy/data/json/load-config-election-2026-draft.json'
)
const PDC_DATASET_URL = 'https://data.wa.gov/resource/kv7h-kjye.json'
const VOTEWA_URL = 'https://voter.votewa.gov/elections/candidate.ashx'

// Race IDs to exclude from the import. Precinct Committee Officer races are
// already excluded from the config itself. Scope pruning of the statewide
// judicial races (Supreme Court / Court of Appeals) and the LD 14/15 races
// that only clip Benton County is pending an editorial decision -- add their
// raceIds here once that decision is made.
const SKIP_RACES: string[] = []

// PDC filer_ids that must never be matched to a candidate.
// Nikki Torres has three 2026 filings; TORRN3-301 (LD8 Senate) is her actual
// race. TORRN--301 (LD16 Senate) and TORRN2-301 (LD15 Senate) are stale.
// Per-race PDC context matching already excludes them, but TORRN--301 is
// ignored explicitly so it can never attach even if contexts are edited.
const IGNORED_FILER_IDS = ['TORRN--301']

// --- Race definitions -----------------------------------------------------

interface PdcContext {
  office?: string // PDC `office` value, e.g. 'COUNTY SHERIFF'
  county?: 'BENTON' | 'FRANKLIN' // PDC `jurisdiction_county`
  district?: string // legislative district, unpadded ('8', '14', '16')
  jurisdiction?: string // exact PDC `jurisdiction`, e.g. 'CITY OF RICHLAND'
  congressionalDistrict?: string // trailing number of a CONGRESSIONAL jurisdiction
}

interface RaceDef {
  raceId: string
  officeTitle: string
  officeType: OfficeType
  regionName: string
  jobTitle: string
  position: number | null
  // null = no PDC filer expected in our Benton/Franklin-scoped PDC query
  // (statewide judicial); matching is skipped and stateId stays null.
  pdc: PdcContext | null
  note?: string
}

const RACE_DEFS: RaceDef[] = [
  // --- Federal ---
  {
    raceId: '179008',
    officeTitle: 'U.S. House District 4',
    officeType: 'US_HOUSE',
    regionName: 'United States',
    jobTitle: 'Representative',
    position: null,
    pdc: { congressionalDistrict: '4' },
  },
  {
    raceId: '174861',
    officeTitle: 'U.S. House District 5',
    officeType: 'US_HOUSE',
    regionName: 'United States',
    jobTitle: 'Representative',
    position: null,
    pdc: { congressionalDistrict: '5' },
    note: 'Franklin ballots only (see GUIDE_EXCEPTIONS)',
  },

  // --- Legislative District 8 (Benton County) ---
  {
    raceId: '178149',
    officeTitle: '8th District Senator',
    officeType: 'STATE_SENATOR',
    regionName: 'Benton County',
    jobTitle: 'Senator',
    position: null,
    pdc: { district: '8', office: 'STATE SENATOR' },
  },
  {
    raceId: '170267',
    officeTitle: '8th District Representative Pos 1',
    officeType: 'STATE_REPRESENTATIVE',
    regionName: 'Benton County',
    jobTitle: 'Representative',
    position: 1,
    pdc: { district: '8', office: 'STATE REPRESENTATIVE' },
  },
  {
    raceId: '183253',
    officeTitle: '8th District Representative Pos 2',
    officeType: 'STATE_REPRESENTATIVE',
    regionName: 'Benton County',
    jobTitle: 'Representative',
    position: 2,
    pdc: { district: '8', office: 'STATE REPRESENTATIVE' },
  },

  // --- Legislative District 14 (clips Benton; editorial pruning pending) ---
  {
    raceId: '185042',
    officeTitle: '14th District Representative Pos 1',
    officeType: 'STATE_REPRESENTATIVE',
    regionName: 'Benton County',
    jobTitle: 'Representative',
    position: 1,
    pdc: { district: '14', office: 'STATE REPRESENTATIVE' },
    note: 'LD14 only clips Benton County',
  },
  {
    raceId: '179165',
    officeTitle: '14th District Representative Pos 2',
    officeType: 'STATE_REPRESENTATIVE',
    regionName: 'Benton County',
    jobTitle: 'Representative',
    position: 2,
    pdc: { district: '14', office: 'STATE REPRESENTATIVE' },
    note: 'LD14 only clips Benton County',
  },

  // --- Legislative District 15 (clips Benton; editorial pruning pending) ---
  {
    raceId: '174856',
    officeTitle: '15th District Senator',
    officeType: 'STATE_SENATOR',
    regionName: 'Benton County',
    jobTitle: 'Senator',
    position: null,
    pdc: { district: '15', office: 'STATE SENATOR' },
    note: 'LD15 only clips Benton County',
  },
  {
    raceId: '175563',
    officeTitle: '15th District Representative Pos 1',
    officeType: 'STATE_REPRESENTATIVE',
    regionName: 'Benton County',
    jobTitle: 'Representative',
    position: 1,
    pdc: { district: '15', office: 'STATE REPRESENTATIVE' },
    note: 'LD15 only clips Benton County',
  },
  {
    raceId: '181651',
    officeTitle: '15th District Representative Pos 2',
    officeType: 'STATE_REPRESENTATIVE',
    regionName: 'Benton County',
    jobTitle: 'Representative',
    position: 2,
    pdc: { district: '15', office: 'STATE REPRESENTATIVE' },
    note: 'LD15 only clips Benton County',
  },

  // --- Legislative District 16 (Franklin County) ---
  {
    raceId: '174313',
    officeTitle: '16th District Representative Pos 1',
    officeType: 'STATE_REPRESENTATIVE',
    regionName: 'Franklin County',
    jobTitle: 'Representative',
    position: 1,
    pdc: { district: '16', office: 'STATE REPRESENTATIVE' },
  },
  {
    raceId: '173194',
    officeTitle: '16th District Representative Pos 2',
    officeType: 'STATE_REPRESENTATIVE',
    regionName: 'Franklin County',
    jobTitle: 'Representative',
    position: 2,
    pdc: { district: '16', office: 'STATE REPRESENTATIVE' },
  },

  // --- Benton County ---
  {
    raceId: '177238',
    officeTitle: 'Benton County Assessor',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Benton County',
    jobTitle: 'Assessor',
    position: null,
    pdc: { county: 'BENTON', office: 'COUNTY ASSESSOR' },
  },
  {
    raceId: '180847',
    officeTitle: 'Benton County Auditor',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Benton County',
    jobTitle: 'Auditor',
    position: null,
    pdc: { county: 'BENTON', office: 'COUNTY AUDITOR' },
  },
  {
    raceId: '179601',
    officeTitle: 'Benton County Clerk',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Benton County',
    jobTitle: 'Clerk',
    position: null,
    pdc: { county: 'BENTON', office: 'COUNTY CLERK' },
  },
  {
    raceId: '177576',
    officeTitle: 'Benton County Commissioner District 2',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Benton County',
    jobTitle: 'Commissioner',
    position: 2,
    pdc: { county: 'BENTON', office: 'COUNTY COMMISSIONER' },
  },
  {
    raceId: '181195',
    officeTitle: 'Benton County Coroner',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Benton County',
    jobTitle: 'Coroner',
    position: null,
    pdc: { county: 'BENTON', office: 'COUNTY CORONER' },
  },
  {
    raceId: '176702',
    officeTitle: 'Benton County Prosecutor',
    officeType: 'PROSECUTOR',
    regionName: 'Benton County',
    jobTitle: 'Prosecutor',
    position: null,
    pdc: { county: 'BENTON', office: 'COUNTY PROSECUTOR' },
  },
  {
    raceId: '177799',
    officeTitle: 'Benton County Sheriff',
    officeType: 'SHERIFF',
    regionName: 'Benton County',
    jobTitle: 'Sheriff',
    position: null,
    pdc: { county: 'BENTON', office: 'COUNTY SHERIFF' },
  },
  {
    raceId: '183319',
    officeTitle: 'Benton County Treasurer',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Benton County',
    jobTitle: 'Treasurer',
    position: null,
    pdc: { county: 'BENTON', office: 'COUNTY TREASURER' },
  },
  {
    raceId: '180679',
    officeTitle: 'Benton County District Court Judge Pos 1',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Benton County',
    jobTitle: 'Judge',
    position: 1,
    pdc: { county: 'BENTON', office: 'DISTRICT COURT JUDGE' },
  },
  {
    raceId: '181636',
    officeTitle: 'Benton County District Court Judge Pos 2',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Benton County',
    jobTitle: 'Judge',
    position: 2,
    pdc: { county: 'BENTON', office: 'DISTRICT COURT JUDGE' },
  },
  {
    raceId: '180435',
    officeTitle: 'Benton County District Court Judge Pos 3',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Benton County',
    jobTitle: 'Judge',
    position: 3,
    pdc: { county: 'BENTON', office: 'DISTRICT COURT JUDGE' },
  },
  {
    raceId: '180670',
    officeTitle: 'Benton County District Court Judge Pos 4',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Benton County',
    jobTitle: 'Judge',
    position: 4,
    pdc: { county: 'BENTON', office: 'DISTRICT COURT JUDGE' },
  },
  {
    raceId: '175063',
    officeTitle: 'Benton County District Court Judge Pos 5',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Benton County',
    jobTitle: 'Judge',
    position: 5,
    pdc: { county: 'BENTON', office: 'DISTRICT COURT JUDGE' },
  },
  {
    raceId: '179867',
    officeTitle: 'Benton PUD Commissioner District 2 Pos 2',
    officeType: 'PORT_COMMISSIONER',
    regionName: 'Benton County',
    jobTitle: 'Commissioner',
    position: 2,
    pdc: { county: 'BENTON', office: 'PUD COMMISSIONER' },
  },

  // --- City of Richland (unexpired council term on a county-year ballot) ---
  {
    raceId: '177131',
    officeTitle: 'Richland City Council Pos 4',
    officeType: 'CITY_COUNCIL',
    regionName: 'Richland',
    jobTitle: 'Council member',
    position: 4,
    pdc: { jurisdiction: 'CITY OF RICHLAND', office: 'CITY COUNCIL MEMBER' },
    note: 'unexpired term',
  },

  // --- Franklin County ---
  {
    raceId: '180138',
    officeTitle: 'Franklin County Assessor',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Franklin County',
    jobTitle: 'Assessor',
    position: null,
    pdc: { county: 'FRANKLIN', office: 'COUNTY ASSESSOR' },
  },
  {
    raceId: '186432',
    officeTitle: 'Franklin County Auditor',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Franklin County',
    jobTitle: 'Auditor',
    position: null,
    pdc: { county: 'FRANKLIN', office: 'COUNTY AUDITOR' },
  },
  {
    raceId: '179876',
    officeTitle: 'Franklin County Clerk',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Franklin County',
    jobTitle: 'Clerk',
    position: null,
    pdc: { county: 'FRANKLIN', office: 'COUNTY CLERK' },
  },
  {
    raceId: '181359',
    officeTitle: 'Franklin County Commissioner District 3',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Franklin County',
    jobTitle: 'Commissioner',
    position: 3,
    pdc: { county: 'FRANKLIN', office: 'COUNTY COMMISSIONER' },
  },
  {
    raceId: '172968',
    officeTitle: 'Franklin County Coroner',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Franklin County',
    jobTitle: 'Coroner',
    position: null,
    pdc: { county: 'FRANKLIN', office: 'COUNTY CORONER' },
  },
  {
    raceId: '173264',
    officeTitle: 'Franklin County Prosecutor',
    officeType: 'PROSECUTOR',
    regionName: 'Franklin County',
    jobTitle: 'Prosecutor',
    position: null,
    pdc: { county: 'FRANKLIN', office: 'COUNTY PROSECUTOR' },
  },
  {
    raceId: '182822',
    officeTitle: 'Franklin County Sheriff',
    officeType: 'SHERIFF',
    regionName: 'Franklin County',
    jobTitle: 'Sheriff',
    position: null,
    pdc: { county: 'FRANKLIN', office: 'COUNTY SHERIFF' },
  },
  {
    raceId: '177743',
    officeTitle: 'Franklin County Treasurer',
    officeType: 'COUNTY_COMMISSIONER',
    regionName: 'Franklin County',
    jobTitle: 'Treasurer',
    position: null,
    pdc: { county: 'FRANKLIN', office: 'COUNTY TREASURER' },
  },
  {
    raceId: '174349',
    officeTitle: 'Franklin County District Court Judge',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Franklin County',
    jobTitle: 'Judge',
    position: null,
    pdc: { county: 'FRANKLIN', office: 'DISTRICT COURT JUDGE' },
  },
  {
    raceId: '172928',
    officeTitle: 'Franklin PUD Commissioner District 2',
    officeType: 'PORT_COMMISSIONER',
    regionName: 'Franklin County',
    jobTitle: 'Commissioner',
    position: null,
    pdc: { county: 'FRANKLIN', office: 'PUD COMMISSIONER' },
  },
  {
    raceId: '185888',
    officeTitle: 'Port of Pasco Commissioner District 3',
    officeType: 'PORT_COMMISSIONER',
    regionName: 'Pasco',
    jobTitle: 'Commissioner',
    position: 3,
    pdc: { county: 'FRANKLIN', office: 'PORT COMMISSIONER' },
  },

  // --- Statewide judicial (editorial pruning pending) ---
  {
    raceId: '183585',
    officeTitle: 'Supreme Court Justice Pos 1',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Washington State',
    jobTitle: 'Justice',
    position: 1,
    pdc: null,
    note: 'unexpired term',
  },
  {
    raceId: '170155',
    officeTitle: 'Supreme Court Justice Pos 3',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Washington State',
    jobTitle: 'Justice',
    position: 3,
    pdc: null,
  },
  {
    raceId: '174688',
    officeTitle: 'Supreme Court Justice Pos 4',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Washington State',
    jobTitle: 'Justice',
    position: 4,
    pdc: null,
  },
  {
    raceId: '186441',
    officeTitle: 'Supreme Court Justice Pos 5',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Washington State',
    jobTitle: 'Justice',
    position: 5,
    pdc: null,
    note: 'unexpired term',
  },
  {
    raceId: '171290',
    officeTitle: 'Supreme Court Justice Pos 7',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Washington State',
    jobTitle: 'Justice',
    position: 7,
    pdc: null,
  },
  {
    raceId: '183847',
    officeTitle: 'Court of Appeals Division 3 District 2 Judge Pos 1',
    officeType: 'SUPERIOR_COURT_JUDGE',
    regionName: 'Washington State',
    jobTitle: 'Judge',
    position: 1,
    pdc: null,
    note: 'unexpired term',
  },
]

// --- Race -> guide mapping -------------------------------------------------
// Rules (in order):
// 1. Explicit exceptions below win.
// 2. Offices homed in a county region belong to that county's guide. This
//    covers the legislative-district convention baked into RACE_DEFS:
//    16th District -> Franklin County, 8th/9th (and 14th/15th, which only
//    clip Benton) -> Benton County.
// 3. Offices homed in a city region belong to the county containing the city.
// 4. Everything else (statewide judicial, federal) appears in both guides.
const GUIDE_REGIONS = ['Benton County', 'Franklin County']

const CITY_TO_COUNTY: Record<string, string> = {
  Richland: 'Benton County',
  Kennewick: 'Benton County',
  'West Richland': 'Benton County',
  Pasco: 'Franklin County',
}

const GUIDE_EXCEPTIONS: Record<string, string[]> = {
  // CD5 appears only on Franklin County ballots
  '174861': ['Franklin County'],
}

function guidesForRace(def: RaceDef): string[] {
  if (GUIDE_EXCEPTIONS[def.raceId]) return GUIDE_EXCEPTIONS[def.raceId]
  if (GUIDE_REGIONS.includes(def.regionName)) return [def.regionName]
  if (CITY_TO_COUNTY[def.regionName]) return [CITY_TO_COUNTY[def.regionName]]
  return [...GUIDE_REGIONS]
}

// --- VoteWA roster fetch ----------------------------------------------------

interface RosterCandidate {
  ballotId: string
  name: string
  party: string | null
  raceName: string
  raceJurisdiction: string
}

function collapse(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function parseParty(partyName: string): string | null {
  const match = /Prefers\s+(.+?)\s+Party/i.exec(partyName || '')
  return match ? match[1].trim() : null
}

async function fetchRoster(electionId: string, raceId: string): Promise<RosterCandidate[]> {
  const url = `${VOTEWA_URL}?e=${electionId}&r=${raceId}&la=&c=`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`VoteWA fetch failed for race ${raceId}: HTTP ${response.status}`)
  }
  const data = (await response.json()) as Array<{
    statement?: {
      BallotID?: string | number
      BallotName?: string
      PartyName?: string
      RaceName?: string
      RaceJurisdictionName?: string
    }
  }>

  const seen = new Set<string>()
  const roster: RosterCandidate[] = []
  for (const item of data) {
    const s = item.statement
    if (!s || !s.BallotName) continue
    const ballotId = String(s.BallotID ?? '')
    if (ballotId && seen.has(ballotId)) continue
    if (ballotId) seen.add(ballotId)
    roster.push({
      ballotId,
      name: collapse(s.BallotName),
      party: parseParty(s.PartyName || ''),
      raceName: collapse(s.RaceName || ''),
      raceJurisdiction: collapse(s.RaceJurisdictionName || ''),
    })
  }
  return roster
}

// --- PDC filer fetch and matching -------------------------------------------

interface PdcFiler {
  filer_id: string
  filer_name: string
  office: string
  jurisdiction: string
  jurisdiction_county: string
  legislative_district: string
}

async function fetchPdcFilers(): Promise<PdcFiler[]> {
  const where =
    `election_year='${ELECTION_YEAR}' AND (` +
    `jurisdiction_county IN ('BENTON','FRANKLIN') ` +
    `OR legislative_district IN ('08','8','09','9','14','15','16') ` +
    `OR jurisdiction LIKE '%CONGRESS%')`
  const fields =
    'filer_id,filer_name,office,jurisdiction,jurisdiction_county,legislative_district'
  const params = new URLSearchParams({
    $select: fields,
    $group: fields,
    $where: where,
    $limit: '5000',
  })

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (process.env.SOCRATA_API_ID && process.env.SOCRATA_API_SECRET) {
    const auth = Buffer.from(
      `${process.env.SOCRATA_API_ID}:${process.env.SOCRATA_API_SECRET}`
    ).toString('base64')
    headers.Authorization = `Basic ${auth}`
  }

  const response = await fetch(`${PDC_DATASET_URL}?${params.toString()}`, { headers })
  if (!response.ok) {
    throw new Error(`PDC Socrata query failed: HTTP ${response.status} - ${await response.text()}`)
  }
  const rows = (await response.json()) as Array<Record<string, string>>

  const byId = new Map<string, PdcFiler>()
  for (const row of rows) {
    if (!row.filer_id) continue
    if (IGNORED_FILER_IDS.includes(row.filer_id)) continue
    // Rows with no office are PACs/committees, not candidate campaigns
    if (!row.office) continue
    if (!byId.has(row.filer_id)) {
      byId.set(row.filer_id, {
        filer_id: row.filer_id,
        filer_name: collapse(row.filer_name || ''),
        office: row.office || '',
        jurisdiction: row.jurisdiction || '',
        jurisdiction_county: row.jurisdiction_county || '',
        legislative_district: row.legislative_district || '',
      })
    }
  }
  return Array.from(byId.values())
}

function filerMatchesContext(filer: PdcFiler, ctx: PdcContext): boolean {
  if (ctx.office && filer.office !== ctx.office) return false
  if (ctx.county && filer.jurisdiction_county !== ctx.county) return false
  if (ctx.jurisdiction && filer.jurisdiction !== ctx.jurisdiction) return false
  if (ctx.district) {
    const filerDistrict = String(parseInt(filer.legislative_district || '', 10))
    if (filerDistrict !== ctx.district) return false
  }
  if (ctx.congressionalDistrict) {
    if (!/CONGRESS/i.test(filer.jurisdiction)) return false
    const match = /(\d+)\s*$/.exec(filer.jurisdiction)
    if (!match || String(parseInt(match[1], 10)) !== ctx.congressionalDistrict) return false
  }
  return true
}

function stripParens(s: string): string {
  let out = s
  while (/\([^()]*\)/.test(out)) out = out.replace(/\([^()]*\)/g, ' ')
  return collapse(out)
}

function stripQuotes(s: string): string {
  return collapse(s.replace(/["“”][^"“”]*["“”]/g, ' '))
}

// PDC filer names look like 'Julie E. Long (Julie Long)',
// 'Dimas, Chelsea E. (Chelsea Dimas)' or 'MENDOZA MARIA G (Gloria Mendoza)'.
// Generate plausible display-order variants for fuzzy matching.
function filerNameVariants(raw: string): string[] {
  const variants = new Set<string>()
  const clean = collapse(raw)
  if (!clean) return []

  const parenStart = clean.indexOf('(')
  const outer = collapse(parenStart >= 0 ? clean.slice(0, parenStart) : clean)
  const inner =
    parenStart >= 0 && clean.lastIndexOf(')') > parenStart
      ? collapse(clean.slice(parenStart + 1, clean.lastIndexOf(')')))
      : null

  for (const base of [outer, inner].filter((v): v is string => !!v)) {
    variants.add(base)
    variants.add(stripParens(base))
    if (base.includes(',')) {
      const [last, rest] = base.split(',', 2)
      variants.add(collapse(`${rest} ${last}`))
    } else {
      // 'LAST FIRST M' -> 'FIRST M LAST'
      const tokens = stripParens(base).split(' ')
      if (tokens.length > 1) {
        variants.add(collapse(`${tokens.slice(1).join(' ')} ${tokens[0]}`))
      }
    }
  }
  return Array.from(variants).filter(Boolean)
}

function ballotNameVariants(raw: string): string[] {
  const variants = new Set<string>()
  const clean = collapse(raw)
  variants.add(clean)
  variants.add(stripQuotes(clean))
  variants.add(stripParens(clean))
  variants.add(stripParens(stripQuotes(clean)))
  const tokens = stripParens(stripQuotes(clean)).split(' ')
  if (tokens.length > 2) {
    variants.add(`${tokens[0]} ${tokens[tokens.length - 1]}`)
  }
  return Array.from(variants).filter(Boolean)
}

// Fold accented characters to ASCII (e.g. 'Morfín' -> 'Morfin') so VoteWA
// ballot names line up with PDC filer names.
function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

interface FilerMatch {
  filerId: string
  confidence: number
}

function matchCandidateToFiler(
  ballotName: string,
  eligibleFilers: PdcFiler[]
): FilerMatch | null {
  if (eligibleFilers.length === 0) return null
  const matcher = new NameMatcher()
  for (const filer of eligibleFilers) {
    for (const variant of filerNameVariants(filer.filer_name)) {
      matcher.addKnownName(fold(variant), filer.filer_id)
    }
  }

  let best: FilerMatch | null = null
  for (const variant of ballotNameVariants(ballotName)) {
    const result = matcher.findMatch(fold(variant))
    if (result.source !== 'none' && (!best || result.confidence > best.confidence)) {
      best = { filerId: result.normalizedName, confidence: result.confidence }
    }
  }
  return best
}

// --- Config loading and validation -------------------------------------------

interface ElectionConfig {
  year: string
  electionId: string
  raceIds: string[]
  _notes?: { _races?: Record<string, string> }
}

function loadConfig(): ElectionConfig {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
  const config = JSON.parse(raw) as ElectionConfig
  if (!config.electionId || !Array.isArray(config.raceIds)) {
    throw new Error(`Config at ${CONFIG_PATH} is missing electionId or raceIds`)
  }
  return config
}

function validateConfigAgainstDefs(config: ElectionConfig) {
  const configIds = new Set(config.raceIds)
  const notesIds = new Set(Object.keys(config._notes?._races ?? {}))
  const defIds = new Set(RACE_DEFS.map(def => def.raceId))

  const problems: string[] = []

  if (notesIds.size > 0) {
    for (const id of configIds) {
      if (!notesIds.has(id)) problems.push(`raceIds has ${id} but _notes._races does not`)
    }
    for (const id of notesIds) {
      if (!configIds.has(id)) problems.push(`_notes._races has ${id} but raceIds does not`)
    }
  }

  for (const id of configIds) {
    if (!defIds.has(id) && !SKIP_RACES.includes(id)) {
      problems.push(
        `Config race ${id} (${config._notes?._races?.[id] ?? 'unknown'}) has no entry in RACE_DEFS or SKIP_RACES`
      )
    }
  }
  for (const id of defIds) {
    if (!configIds.has(id)) {
      problems.push(`RACE_DEFS has ${id} which is not in the config raceIds`)
    }
  }
  for (const id of SKIP_RACES) {
    if (!configIds.has(id)) {
      problems.push(`SKIP_RACES has ${id} which is not in the config raceIds`)
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Config/RACE_DEFS mismatch:\n  - ${problems.join('\n  - ')}\n` +
        'Update RACE_DEFS in scripts/import/bootstrap-2026.ts to match the config.'
    )
  }
}

// --- Main --------------------------------------------------------------------

interface Counters {
  created: number
  existing: number
}

async function main() {
  const write = process.env.IMPORT_MODE === 'db'
  console.log(
    `\n🗳️  Bootstrapping ${ELECTION_YEAR} ${ELECTION_TYPE} ballot ` +
      `${write ? '(WRITING TO DATABASE)' : '(DRY RUN — set IMPORT_MODE=db to write)'}\n`
  )

  const config = loadConfig()
  validateConfigAgainstDefs(config)
  console.log(
    `✓ Config OK: electionId ${config.electionId}, ${config.raceIds.length} races ` +
      `(${SKIP_RACES.length} skipped, ${RACE_DEFS.length} to import)\n`
  )

  // --- Load DB context ---
  const regions = await prisma.region.findMany()
  const regionByName = new Map(regions.map(r => [r.name, r]))

  const guides = await prisma.guide.findMany({
    where: { electionYear: ELECTION_YEAR, type: ELECTION_TYPE },
    include: { region: true, Race: { select: { id: true } } },
  })
  const guideByRegion = new Map(guides.map(g => [g.region.name, g]))

  const missingGuides = GUIDE_REGIONS.filter(name => !guideByRegion.has(name))
  if (missingGuides.length > 0) {
    const message =
      `Missing ${ELECTION_YEAR} ${ELECTION_TYPE} guide(s) for: ${missingGuides.join(', ')}. ` +
      'Run `npm run prepare:2026` first to create regions, offices, and guides.'
    if (write) {
      throw new Error(message)
    }
    console.log(`⚠️  ${message}\n   Continuing dry run; links to missing guides are marked below.\n`)
  }

  const existingOffices = await prisma.office.findMany({ include: { region: true } })
  const officeByKey = new Map(existingOffices.map(o => [`${o.region.name}|${o.title}`, o]))

  const existingRaces = await prisma.race.findMany({
    where: { electionYear: ELECTION_YEAR, type: ELECTION_TYPE },
  })
  const raceByOfficeId = new Map(existingRaces.map(r => [r.officeId, r]))

  const existingCandidates = await prisma.candidate.findMany({
    where: { electionYear: ELECTION_YEAR },
    include: { races: true },
  })

  // --- Fetch external data ---
  console.log('📡 Fetching PDC filers (kv7h-kjye)...')
  const filers = await fetchPdcFilers()
  console.log(`   ${filers.length} candidate filers with ${ELECTION_YEAR} contribution data\n`)

  console.log(`📡 Fetching candidate rosters from VoteWA (election ${config.electionId})...`)
  const rosters = new Map<string, RosterCandidate[]>()
  for (const def of RACE_DEFS) {
    rosters.set(def.raceId, await fetchRoster(config.electionId, def.raceId))
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  const totalRoster = Array.from(rosters.values()).reduce((n, r) => n + r.length, 0)
  console.log(`   ${totalRoster} candidates across ${rosters.size} races\n`)

  // --- Plan/execute ---
  const counts: Record<'offices' | 'races' | 'candidates' | 'joins' | 'guideLinks', Counters> = {
    offices: { created: 0, existing: 0 },
    races: { created: 0, existing: 0 },
    candidates: { created: 0, existing: 0 },
    joins: { created: 0, existing: 0 },
    guideLinks: { created: 0, existing: 0 },
  }
  let candidateUpdates = 0
  const matchedFilerIds = new Map<string, string>() // filer_id -> candidate name
  const unmatchedCandidates: string[] = []
  const warnings: string[] = []
  const guideMappingRows: string[] = []

  const DRY_ID = '(new)'

  for (const def of RACE_DEFS) {
    const roster = rosters.get(def.raceId) || []
    const guideNames = guidesForRace(def)
    const sample = roster[0]
    console.log(`\n=== [${def.raceId}] ${def.officeTitle} ===`)
    console.log(
      `    VoteWA: "${sample ? sample.raceName : '?'}" (${sample ? sample.raceJurisdiction : '?'})` +
        ` | ${roster.length} candidate(s)` +
        (def.note ? ` | note: ${def.note}` : '')
    )
    if (roster.length === 0) {
      warnings.push(`Race ${def.raceId} (${def.officeTitle}) has an empty VoteWA roster`)
    }

    guideMappingRows.push(
      `${def.raceId}  ${def.officeTitle.padEnd(52)} -> ${guideNames.join(' + ')}`
    )

    // Region
    const region = regionByName.get(def.regionName)
    if (!region) {
      const message =
        `Region "${def.regionName}" not found (needed by ${def.officeTitle}). ` +
        'Run `npm run prepare:2026` first.'
      if (write) throw new Error(message)
      console.log(`    ! Region ${def.regionName} MISSING (run \`npm run prepare:2026\`)`)
      if (!warnings.includes(message)) warnings.push(message)
    }

    // Office
    const officeKey = `${def.regionName}|${def.officeTitle}`
    let office = officeByKey.get(officeKey)
    if (office) {
      counts.offices.existing++
      console.log(`    ✓ Office exists: ${def.officeTitle} (${def.regionName}, ${office.type})`)
    } else {
      counts.offices.created++
      console.log(
        `    + Office: ${def.officeTitle} (${def.regionName}, ${def.officeType}, job: ${def.jobTitle})`
      )
      if (write) {
        office = await prisma.office.create({
          data: {
            title: def.officeTitle,
            type: def.officeType,
            // write mode throws above when the region is missing
            regionId: region!.id,
            position: def.position,
            jobTitle: def.jobTitle,
          },
          include: { region: true },
        })
        officeByKey.set(officeKey, office)
      }
    }
    const officeId = office ? office.id : DRY_ID

    // Race
    let race = office ? raceByOfficeId.get(office.id) : undefined
    if (race) {
      counts.races.existing++
      console.log(`    ✓ Race exists (${race.id})`)
    } else {
      counts.races.created++
      console.log(`    + Race: ${ELECTION_YEAR} ${ELECTION_TYPE}`)
      if (write) {
        race = await prisma.race.create({
          data: { electionYear: ELECTION_YEAR, officeId, type: ELECTION_TYPE },
        })
        raceByOfficeId.set(officeId, race)
      }
    }
    const raceId = race ? race.id : DRY_ID

    // Guide links
    for (const guideName of guideNames) {
      const guide = guideByRegion.get(guideName)
      if (!guide) {
        console.log(`    ! Guide link: ${guideName} guide MISSING (run \`npm run prepare:2026\`)`)
        counts.guideLinks.created++
        continue
      }
      const alreadyLinked = race ? guide.Race.some(r => r.id === race!.id) : false
      if (alreadyLinked) {
        counts.guideLinks.existing++
        console.log(`    ✓ Linked to ${guideName} guide`)
      } else {
        counts.guideLinks.created++
        console.log(`    + Link to ${guideName} guide`)
        if (write && race) {
          await prisma.guide.update({
            where: { id: guide.id },
            data: { Race: { connect: { id: race.id } } },
          })
          guide.Race.push({ id: race.id })
        }
      }
    }

    // Candidates
    const eligibleFilers = def.pdc
      ? filers.filter(filer => filerMatchesContext(filer, def.pdc!))
      : []

    for (const rosterCandidate of roster) {
      const match = def.pdc ? matchCandidateToFiler(rosterCandidate.name, eligibleFilers) : null
      if (match) {
        const previous = matchedFilerIds.get(match.filerId)
        if (previous && previous !== rosterCandidate.name) {
          warnings.push(
            `Filer ${match.filerId} matched multiple candidates: ${previous} and ${rosterCandidate.name}`
          )
        }
        matchedFilerIds.set(match.filerId, rosterCandidate.name)
      } else {
        unmatchedCandidates.push(`${rosterCandidate.name} (${def.officeTitle})`)
      }

      const normalizedName = fold(stripQuotes(stripParens(rosterCandidate.name))).toLowerCase()
      let candidate = existingCandidates.find(
        c =>
          c.officeId === officeId &&
          (c.name === rosterCandidate.name ||
            fold(stripQuotes(stripParens(c.name))).toLowerCase() === normalizedName)
      )
      if (!candidate) {
        const byName = existingCandidates.find(
          c => fold(stripQuotes(stripParens(c.name))).toLowerCase() === normalizedName
        )
        if (byName) {
          candidate = byName
          if (office && byName.officeId !== office.id) {
            warnings.push(
              `Candidate ${byName.name} already exists under a different office; reusing without moving`
            )
          }
        }
      }

      const matchLabel = match
        ? `PDC ${match.filerId}${match.confidence < 1 ? ` (~${match.confidence.toFixed(2)})` : ''}`
        : def.pdc
          ? 'no PDC filer'
          : 'PDC n/a'

      if (candidate) {
        counts.candidates.existing++
        const updates: { stateId?: string; party?: string } = {}
        if (match && candidate.stateId !== match.filerId) updates.stateId = match.filerId
        if (rosterCandidate.party && !candidate.party) updates.party = rosterCandidate.party
        if (Object.keys(updates).length > 0) {
          candidateUpdates++
          console.log(
            `    ~ Candidate exists, update: ${rosterCandidate.name} [${Object.entries(updates)
              .map(([k, v]) => `${k}=${v}`)
              .join(', ')}]`
          )
          if (write) {
            await prisma.candidate.update({ where: { id: candidate.id }, data: updates })
          }
        } else {
          console.log(`    ✓ Candidate exists: ${rosterCandidate.name} [${matchLabel}]`)
        }
      } else {
        counts.candidates.created++
        console.log(
          `    + Candidate: ${rosterCandidate.name}` +
            (rosterCandidate.party ? ` (${rosterCandidate.party})` : '') +
            ` [${matchLabel}]`
        )
        if (write) {
          candidate = await prisma.candidate.create({
            data: {
              name: rosterCandidate.name,
              electionYear: ELECTION_YEAR,
              officeId,
              stateId: match ? match.filerId : null,
              party: rosterCandidate.party,
            },
            include: { races: true },
          })
          existingCandidates.push(candidate)
        }
      }

      // Candidate <-> race join
      const joined =
        candidate && race ? candidate.races.some(cr => cr.raceId === race!.id) : false
      if (joined) {
        counts.joins.existing++
      } else {
        counts.joins.created++
        if (write && candidate && race) {
          await prisma.candidateRace.upsert({
            where: { candidateId_raceId: { candidateId: candidate.id, raceId } },
            update: {},
            create: { candidateId: candidate.id, raceId },
          })
          candidate.races.push({
            candidateId: candidate.id,
            raceId,
            incumbent: false,
            party: null,
            elected: null,
            voteCount: null,
            votePercent: null,
            termLength: null,
            shortTerm: false,
          })
        }
      }
    }
  }

  // --- Report ---
  console.log('\n\n📋 Race → guide mapping:')
  for (const row of guideMappingRows) console.log(`   ${row}`)

  console.log('\n💰 PDC filer matching:')
  console.log(`   Matched ${matchedFilerIds.size} filer(s):`)
  for (const [filerId, name] of matchedFilerIds) {
    console.log(`     ${filerId.padEnd(12)} -> ${name}`)
  }
  const unmatchedFilers = filers.filter(f => !matchedFilerIds.has(f.filer_id))
  if (unmatchedFilers.length > 0) {
    console.log(`   Filers with no roster candidate (${unmatchedFilers.length}):`)
    for (const filer of unmatchedFilers) {
      console.log(
        `     ${filer.filer_id.padEnd(12)} ${filer.filer_name} — ${filer.office} / ${filer.jurisdiction}`
      )
    }
  }
  console.log(`   Ignored filer ids: ${IGNORED_FILER_IDS.join(', ') || '(none)'}`)
  if (unmatchedCandidates.length > 0) {
    console.log(`   Candidates without a PDC filer (stateId left null): ${unmatchedCandidates.length}`)
    for (const entry of unmatchedCandidates) console.log(`     - ${entry}`)
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    for (const warning of warnings) console.log(`   - ${warning}`)
  }

  console.log('\n📊 Summary:')
  console.log(`   Offices:     ${counts.offices.created} to create, ${counts.offices.existing} existing`)
  console.log(`   Races:       ${counts.races.created} to create, ${counts.races.existing} existing`)
  console.log(`   Guide links: ${counts.guideLinks.created} to create, ${counts.guideLinks.existing} existing`)
  console.log(
    `   Candidates:  ${counts.candidates.created} to create, ${counts.candidates.existing} existing` +
      (candidateUpdates ? ` (${candidateUpdates} to update)` : '')
  )
  console.log(`   Race joins:  ${counts.joins.created} to create, ${counts.joins.existing} existing`)

  if (write) {
    console.log('\n✅ Bootstrap written to database.')
    console.log('\n📌 NEXT STEPS:')
    console.log('   1. npm run import:pdc:scrape:fast   → PDC profile URLs + mini filer status')
    console.log(`   2. npm run import:pdc ${ELECTION_YEAR}            → contribution data`)
    console.log('   3. npm run import:pamphlet          → statements/photos (once published)')
  } else {
    console.log('\n💡 Dry run complete. Set IMPORT_MODE=db to apply this plan.')
  }
}

main()
  .catch(error => {
    console.error('\n❌ Bootstrap failed:', error.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

/**
 * Washington State election results.
 *
 * The state serves current-cycle results as JSON from the Enhanced Voting
 * platform behind results.votewa.gov:
 *
 *   https://results.votewa.gov/results/public/api/elections/{jurisdiction}/{YYYYMMDD}/data
 *
 * where {jurisdiction} is `benton-county-wa`, `franklin-county-wa`, or
 * `washington`.
 *
 * The two scopes answer different questions and both are needed. A county
 * jurisdiction returns that county's own offices — under bare titles
 * ("Sheriff", "Assessor"), since the jurisdiction is what says which county —
 * plus that county's SHARE of any race spanning several counties. The
 * `washington` jurisdiction returns only the races that span counties, with
 * their whole totals.
 *
 * A congressional or legislative race is therefore read from `washington`: the
 * Benton and Franklin slice of the 4th District is a third of its vote, so
 * summing the two counties would report a candidate who lost the district as
 * having won it. Each item's `crossCounties` says which case it is, so nothing
 * is counted twice.
 *
 * Elections older than the current cycle answer 204 there. Those are still
 * served by the retired per-county CSV export:
 *
 *   https://results.vote.wa.gov/results/{YYYYMMDD}/export/{YYYYMMDD}_{county}.csv
 *
 * so both paths are kept and the JSON is tried first.
 *
 * This module handles fetching and parsing plus small pure helpers (election
 * date math, write-in detection, Richland short-term selection). Database
 * matching and writes live in scripts/import/results.ts.
 */

export type ResultsElectionType = 'PRIMARY' | 'GENERAL'

export interface ResultRow {
  race: string
  candidate: string
  party: string
  votes: number
  percent: number
  jurisdiction: string
  county: string
  /** The source's own write-in flag; absent on the CSV path. */
  writeIn?: boolean
  /** 'Candidate' | 'BallotMeasure' on the JSON path; absent on the CSV path. */
  contestType?: string
}

const RESULTS_CSV_HEADER = [
  'Race',
  'Candidate',
  'Party',
  'Votes',
  'PercentageOfTotalVotes',
  'JurisdictionName',
]

/**
 * Election date as the YYYYMMDD code used in the results URLs.
 * Primaries are the first Tuesday of August (RCW 29A.04.311); general
 * elections are the first Tuesday after the first Monday of November.
 */
export function electionDateCode(year: number, type: ResultsElectionType): string {
  if (type === 'PRIMARY') {
    return formatDateCode(firstWeekday(year, 7, 2))
  }
  const firstMonday = firstWeekday(year, 10, 1)
  return formatDateCode(new Date(Date.UTC(year, 10, firstMonday.getUTCDate() + 1)))
}

function firstWeekday(year: number, monthIndex: number, weekday: number): Date {
  const first = new Date(Date.UTC(year, monthIndex, 1))
  const offset = (weekday - first.getUTCDay() + 7) % 7
  return new Date(Date.UTC(year, monthIndex, 1 + offset))
}

function formatDateCode(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${date.getUTCFullYear()}${month}${day}`
}

// ---------------------------------------------------------------------------
// JSON API (current cycle)
// ---------------------------------------------------------------------------

/** A county name as the importer spells it ("benton") -> API jurisdiction slug. */
export function jurisdictionSlug(county: string): string {
  return `${county.toLowerCase().replace(/\s+/g, '-')}-county-wa`
}

const API_BASE = 'https://results.votewa.gov/results/public/api/elections'

export function resultsApiUrl(dateCode: string, county: string): string {
  return `${API_BASE}/${jurisdictionSlug(county)}/${dateCode}/data`
}

export function statewideApiUrl(dateCode: string): string {
  return `${API_BASE}/washington/${dateCode}/data`
}

interface ApiLocalizedText {
  languageId: string | null
  text: string
}

interface ApiBallotOption {
  name: ApiLocalizedText[]
  voteCount: number
  party?: { name?: ApiLocalizedText[]; abbreviation?: string | null } | null
  isWriteIn?: boolean
}

interface ApiBallotItem {
  name: ApiLocalizedText[]
  voteTotal: number
  contestType?: string
  /** County names a race spans; empty for a race belonging to one county. */
  crossCounties?: string[] | null
  summaryResults?: { ballotOptions?: ApiBallotOption[] } | null
}

interface ApiElectionData {
  election?: { isOfficialResults?: boolean; asOf?: string } | null
  ballotItems?: ApiBallotItem[] | null
}

function titleCase(text: string): string {
  return text.replace(/\b[a-z]/g, ch => ch.toUpperCase())
}

function localized(texts: ApiLocalizedText[] | undefined | null): string {
  if (!texts || texts.length === 0) return ''
  const english = texts.find(t => t.languageId === 'en') ?? texts[0]
  return (english.text ?? '').trim()
}

/**
 * Certification state of an election, as the source reports it. Returned
 * alongside the rows so the importer can say whether it is writing certified
 * numbers or a night-of count.
 */
export interface ResultsProvenance {
  official: boolean
  asOf: string | null
  source: 'api' | 'csv'
}

export interface CountyResults {
  rows: ResultRow[]
  provenance: ResultsProvenance
}

/**
 * Rows for one jurisdiction.
 *
 * `scope: 'county'` keeps only the races belonging to that county alone, and
 * qualifies their titles with the county — the feed leaves the county out
 * because the request carried it, and "Sheriff" alone collides between
 * counties. `scope: 'state'` keeps only the races spanning counties, whose
 * whole totals are the ones worth reporting.
 */
export function parseResultsApi(
  payload: ApiElectionData,
  jurisdiction: string,
  scope: 'county' | 'state',
  /** Statewide scope only: keep races touching one of these counties. */
  limitToCounties?: string[]
): CountyResults {
  const rows: ResultRow[] = []
  const wanted = limitToCounties?.map(name => name.toLowerCase().replace(/ county$/, ''))

  for (const item of payload.ballotItems ?? []) {
    const crossCounties = item.crossCounties ?? []
    const spansCounties = crossCounties.length > 0

    if (scope === 'county' && spansCounties) continue
    if (scope === 'state' && !spansCounties) continue

    // The statewide feed carries every district in Washington. A race that
    // touches neither of our counties is not ours to report or to explain.
    if (scope === 'state' && wanted) {
      const touchesUs = crossCounties.some(name =>
        wanted.includes(name.toLowerCase().replace(/ county$/, ''))
      )
      if (!touchesUs) continue
    }

    const race =
      scope === 'county'
        ? `${localized(item.name)} - ${titleCase(jurisdiction)} County`
        : localized(item.name)
    const options = item.summaryResults?.ballotOptions ?? []
    const total = item.voteTotal || options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0)

    for (const option of options) {
      const votes = option.voteCount ?? 0
      rows.push({
        race,
        candidate: localized(option.name),
        party: option.party?.abbreviation ?? localized(option.party?.name) ?? '',
        votes,
        percent: total > 0 ? (votes / total) * 100 : 0,
        jurisdiction,
        county: jurisdiction,
        writeIn: option.isWriteIn === true,
        contestType: item.contestType,
      })
    }
  }

  return {
    rows,
    provenance: {
      official: payload.election?.isOfficialResults === true,
      asOf: payload.election?.asOf ?? null,
      source: 'api',
    },
  }
}

async function fetchApi(url: string): Promise<ApiElectionData | null> {
  const response = await fetch(url)
  if (!response.ok || response.status === 204) return null
  const text = await response.text()
  if (text.trim().length === 0) return null
  return JSON.parse(text) as ApiElectionData
}

/**
 * A county's own races. Falls back to the retired CSV export for elections
 * older than the current cycle, which the API answers 204 for.
 */
export async function fetchCountyResults(dateCode: string, county: string): Promise<CountyResults> {
  const apiUrl = resultsApiUrl(dateCode, county)
  const payload = await fetchApi(apiUrl)

  if (payload) {
    return parseResultsApi(payload, county, 'county')
  }

  const csvUrl = resultsCsvUrl(dateCode, county)
  const csvResponse = await fetch(csvUrl)

  if (!csvResponse.ok) {
    throw new Error(
      `No results for ${county} at ${dateCode}: ` +
        `${apiUrl} returned no data, ${csvUrl} returned ${csvResponse.status}`
    )
  }

  return {
    rows: parseResultsCsv(await csvResponse.text(), county),
    provenance: { official: false, asOf: null, source: 'csv' },
  }
}

/**
 * Races spanning several counties — congressional, legislative, appellate —
 * with their whole totals rather than one county's share, narrowed to the ones
 * that touch `counties`. Returns no rows when the statewide feed has nothing
 * for this election, which is how elections older than the current cycle
 * behave; the CSV export carried per-county rows only, so those years keep the
 * summing they were imported with.
 */
export async function fetchStatewideResults(
  dateCode: string,
  counties: string[]
): Promise<CountyResults> {
  const payload = await fetchApi(statewideApiUrl(dateCode))

  if (!payload) {
    return { rows: [], provenance: { official: false, asOf: null, source: 'csv' } }
  }

  return parseResultsApi(payload, 'washington', 'state', counties)
}

// ---------------------------------------------------------------------------
// CSV export (elections older than the current cycle)
// ---------------------------------------------------------------------------

export function resultsCsvUrl(dateCode: string, county: string): string {
  return `https://results.vote.wa.gov/results/${dateCode}/export/${dateCode}_${county.toLowerCase()}.csv`
}

export function parseResultsCsv(csv: string, county: string): ResultRow[] {
  const [header, ...rows] = parseCsv(csv)

  if (!header || RESULTS_CSV_HEADER.some((name, i) => header[i] !== name)) {
    throw new Error(
      `Unexpected results CSV header for ${county}: ${JSON.stringify(header)} ` +
        `(expected ${JSON.stringify(RESULTS_CSV_HEADER)})`
    )
  }

  return rows
    .filter(row => row.length >= RESULTS_CSV_HEADER.length)
    .map(row => ({
      race: row[0].trim(),
      candidate: row[1].trim(),
      party: row[2].trim(),
      votes: Number.parseInt(row[3].replace(/,/g, ''), 10) || 0,
      percent: Number.parseFloat(row[4]) || 0,
      jurisdiction: row[5].trim(),
      county,
    }))
}

/**
 * Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF).
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }

  const pushRow = () => {
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
      rows.push(row)
    }
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      pushField()
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++
      }
      pushField()
      pushRow()
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    pushField()
    pushRow()
  }

  return rows
}

export function isWriteIn(candidate: string): boolean {
  return /^write[\s-]?in$/i.test(candidate.trim())
}

/** True when the source flagged the row as a write-in, or the name says so. */
export function rowIsWriteIn(row: ResultRow): boolean {
  return row.writeIn === true || isWriteIn(row.candidate)
}

/**
 * Richland city council terms are staggered by vote count: among the council
 * winners in a general election, the winner with the fewest votes serves the
 * short term. Returns that winner, or null when there are fewer than two
 * winners to rank.
 */
export function pickShortTermWinner<T extends { voteCount: number }>(winners: T[]): T | null {
  if (winners.length < 2) {
    return null
  }
  return winners.reduce((lowest, winner) => (winner.voteCount < lowest.voteCount ? winner : lowest))
}

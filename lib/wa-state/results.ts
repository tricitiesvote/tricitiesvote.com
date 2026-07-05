/**
 * Washington State election results (results.vote.wa.gov)
 *
 * The state publishes per-county CSV exports for each election at:
 *
 *   https://results.vote.wa.gov/results/{YYYYMMDD}/export/{YYYYMMDD}_{county}.csv
 *
 * Columns: Race, Candidate, Party, Votes, PercentageOfTotalVotes, JurisdictionName
 *
 * This module handles fetching and parsing those exports plus small pure
 * helpers (election date math, write-in detection, Richland short-term
 * selection). Database matching and writes live in scripts/import/results.ts.
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
 * Election date as the YYYYMMDD code used in results.vote.wa.gov URLs.
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

export function resultsCsvUrl(dateCode: string, county: string): string {
  return `https://results.vote.wa.gov/results/${dateCode}/export/${dateCode}_${county.toLowerCase()}.csv`
}

export async function fetchCountyResults(dateCode: string, county: string): Promise<ResultRow[]> {
  const url = resultsCsvUrl(dateCode, county)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch results for ${county} (${url}): ${response.status}`)
  }

  return parseResultsCsv(await response.text(), county)
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

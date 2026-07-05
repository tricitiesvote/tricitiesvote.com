import type { ElectionType } from '@prisma/client'

export const CURRENT_ELECTION_YEAR = 2025

// Which election the site currently displays. Set to 'PRIMARY' during
// primary season, then back to 'GENERAL' once the general ballot is set.
export const CURRENT_ELECTION_TYPE: ElectionType = 'GENERAL'

export function isCurrentElectionYear(year: number): boolean {
  return year === CURRENT_ELECTION_YEAR
}

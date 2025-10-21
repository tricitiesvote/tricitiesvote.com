// @ts-nocheck
import { OfficeType } from '@prisma/client'

type RaceLike = {
  office: {
    type: OfficeType
    title: string
  }
  candidates: Array<{
    candidate: {
      hide: boolean
    }
  }>
}

const ODD_YEAR_PRIORITY: OfficeType[] = [
  OfficeType.BALLOT_MEASURE,
  OfficeType.MAYOR,
  OfficeType.CITY_COUNCIL,
  OfficeType.SCHOOL_BOARD,
  OfficeType.PORT_COMMISSIONER,
]

const EVEN_YEAR_PRIORITY: OfficeType[] = [
  OfficeType.BALLOT_MEASURE,
  OfficeType.COUNTY_COMMISSIONER,
  OfficeType.STATE_SENATOR,
  OfficeType.STATE_REPRESENTATIVE,
  OfficeType.SUPERIOR_COURT_JUDGE,
]

function getTypePriority(type: OfficeType, electionYear: number) {
  const priorityList = electionYear % 2 === 0 ? EVEN_YEAR_PRIORITY : ODD_YEAR_PRIORITY
  const index = priorityList.indexOf(type)
  return index === -1 ? priorityList.length : index
}

function visibleCandidateCount(race: RaceLike) {
  return race.candidates.filter(entry => !entry.candidate.hide).length
}

export function orderRaces<T extends RaceLike>(races: T[], electionYear: number): T[] {
  return [...races].sort((a, b) => {
    const typeRankA = getTypePriority(a.office.type, electionYear)
    const typeRankB = getTypePriority(b.office.type, electionYear)

    if (typeRankA !== typeRankB) {
      return typeRankA - typeRankB
    }

    const aContested = visibleCandidateCount(a) > 1 ? 0 : 1
    const bContested = visibleCandidateCount(b) > 1 ? 0 : 1

    if (aContested !== bContested) {
      return aContested - bContested
    }

    return a.office.title.localeCompare(b.office.title)
  })
}

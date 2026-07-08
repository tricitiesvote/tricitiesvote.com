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
  OfficeType.US_SENATE,
  OfficeType.US_HOUSE,
  OfficeType.STATE_SENATOR,
  OfficeType.STATE_REPRESENTATIVE,
  OfficeType.COUNTY_COMMISSIONER,
  OfficeType.SHERIFF,
  OfficeType.PROSECUTOR,
  OfficeType.MAYOR,
  OfficeType.CITY_COUNCIL,
  OfficeType.SCHOOL_BOARD,
  OfficeType.PORT_COMMISSIONER,
  OfficeType.SUPERIOR_COURT_JUDGE,
]

// County row offices and every judicial office each collapse into a single
// OfficeType (COUNTY_COMMISSIONER, SUPERIOR_COURT_JUDGE). Within the judges
// block, sort statewide appellate courts ahead of local district courts by a
// title heuristic so the hierarchy holds without a schema change.
const JUDICIAL_TITLE_RANK: Array<[RegExp, number]> = [
  [/supreme court/i, 0],
  [/court of appeals/i, 1],
  [/district court/i, 2],
]

function getTypePriority(type: OfficeType, electionYear: number) {
  const priorityList = electionYear % 2 === 0 ? EVEN_YEAR_PRIORITY : ODD_YEAR_PRIORITY
  const index = priorityList.indexOf(type)
  return index === -1 ? priorityList.length : index
}

function judicialTitleRank(title: string) {
  const match = JUDICIAL_TITLE_RANK.find(([pattern]) => pattern.test(title))
  return match ? match[1] : JUDICIAL_TITLE_RANK.length
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

    if (a.office.type === OfficeType.SUPERIOR_COURT_JUDGE) {
      const courtRankA = judicialTitleRank(a.office.title)
      const courtRankB = judicialTitleRank(b.office.title)
      if (courtRankA !== courtRankB) {
        return courtRankA - courtRankB
      }
    }

    const aContested = visibleCandidateCount(a) > 1 ? 0 : 1
    const bContested = visibleCandidateCount(b) > 1 ? 0 : 1

    if (aContested !== bContested) {
      return aContested - bContested
    }

    return a.office.title.localeCompare(b.office.title)
  })
}

import { HIDE_PARTIAL_TCV_RESPONSES, TCV_PARTIAL_HIDE_EXCEPTIONS } from './features'
import { slugify } from './utils'

interface CandidateForStatus {
  id: string
  name: string
  email?: string | null
  hide?: boolean | null
  engagements?: Array<{
    participated: boolean
    engagement: {
      slug: string | null
      title: string | null
    } | null
  }>
}

interface RaceCandidateWrapper {
  candidate: CandidateForStatus
}

export interface TriCitiesCandidateSummary {
  id: string
  name: string
  email?: string | null
}

export interface TriCitiesRaceStatus {
  shouldHide: boolean
  hiddenTitles: string[]
  responding: TriCitiesCandidateSummary[]
  awaiting: TriCitiesCandidateSummary[]
}

const TRI_CITIES_SLUG_PREFIX = 'tri-cities-vote-q-a'

function hasTriCitiesEngagement(engagements: CandidateForStatus['engagements']) {
  if (!engagements) return null
  return engagements.find(entry => entry.engagement?.slug?.startsWith(TRI_CITIES_SLUG_PREFIX)) || null
}

function buildSummary(candidate: CandidateForStatus): TriCitiesCandidateSummary {
  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email || undefined
  }
}

export function evaluateTriCitiesRaceStatus(
  race: { id?: string; office?: { title?: string | null }; candidates: RaceCandidateWrapper[] },
  year: number
): TriCitiesRaceStatus {
  const hiddenTitlesBase = [`${year} City Council Questionnaire`, `${year} School Board Questionnaire`]
  const raceId = typeof race.id === 'string' ? race.id.toLowerCase() : null
  const raceTitle = race.office?.title?.trim() ?? ''
  const raceSlug = raceTitle ? slugify(raceTitle) : null
  const raceTitleKey = raceTitle ? raceTitle.toLowerCase() : null

  const isException = [raceId, raceTitleKey, raceSlug]
    .filter((value): value is string => Boolean(value))
    .some(value => TCV_PARTIAL_HIDE_EXCEPTIONS.has(value))

  const visibleCandidates = race.candidates
    .map(wrapper => wrapper.candidate)
    .filter((candidate): candidate is CandidateForStatus => Boolean(candidate) && !candidate?.hide)

  if (visibleCandidates.length <= 1) {
    return {
      shouldHide: false,
      hiddenTitles: [],
      responding: [],
      awaiting: []
    }
  }

  const responding: TriCitiesCandidateSummary[] = []
  const awaiting: TriCitiesCandidateSummary[] = []

  for (const candidate of visibleCandidates) {
    const triCitiesEngagement = hasTriCitiesEngagement(candidate.engagements)
    const participated = triCitiesEngagement?.participated === true
    if (participated) {
      responding.push(buildSummary(candidate))
    } else {
      awaiting.push(buildSummary(candidate))
    }
  }

  const shouldHide =
    HIDE_PARTIAL_TCV_RESPONSES &&
    responding.length > 0 &&
    awaiting.length > 0 &&
    !isException

  return {
    shouldHide,
    hiddenTitles: shouldHide ? hiddenTitlesBase : [],
    responding,
    awaiting
  }
}

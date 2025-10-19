import { SHOW_UNCONTESTED_RACES } from './features'

type RaceLike = {
  candidates: Array<{
    candidate: {
      hide: boolean
    }
  }>
}

export function isRaceContested(race: RaceLike): boolean {
  const visibleCandidates = race.candidates.filter(({ candidate }) => !candidate.hide)
  return visibleCandidates.length > 1
}

export function getVisibleRaces<T extends RaceLike>(races: T[]): T[] {
  if (SHOW_UNCONTESTED_RACES) {
    return races
  }

  return races.filter(isRaceContested)
}

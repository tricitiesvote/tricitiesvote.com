import { TriCitiesRaceStatus } from '@/lib/triCitiesVote'

interface TriCitiesQuestionnaireBannerProps {
  status: TriCitiesRaceStatus
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export function TriCitiesQuestionnaireBanner({ status }: TriCitiesQuestionnaireBannerProps) {
  if (!status.shouldHide || status.responding.length === 0 || status.awaiting.length === 0) {
    return null
  }

  const respondingNames = formatNameList(status.responding.map(candidate => candidate.name))
  const awaitingNames = formatNameList(status.awaiting.map(candidate => candidate.name))
  const awaitingLabel = status.awaiting.length > 1 ? 'candidates' : 'candidate'
  const respondingIntro = status.responding.length > 1
    ? `We have responses from ${respondingNames}`
    : `We have ${respondingNames}'s responses`
  const primaryAwaiting = status.awaiting.find(candidate => candidate.email)

  return (
    <div className="tcv-banner">
      <p>
        {respondingIntro} but <strong>we are awaiting {awaitingLabel} {awaitingNames}</strong> to complete the Tri-Cities Vote questionnaire.{' '}
        {primaryAwaiting ? (
          <>
            <a href={`mailto:${primaryAwaiting.email}`}>Send them an email</a> or leave Facebook comments requesting their participation so voters have the full picture for this race.
          </>
        ) : (
          <>Leave Facebook comments requesting their participation so voters have the full picture for this race.</>
        )}
      </p>
    </div>
  )
}

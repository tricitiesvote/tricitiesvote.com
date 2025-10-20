import { ensureHtml } from '@/lib/richText'

interface BallotMeasureDetailsProps {
  intro?: string | null
  body?: string | null
}

export function BallotMeasureDetails({ intro, body }: BallotMeasureDetailsProps) {
  const introHtml = ensureHtml(intro)
  const bodyHtml = ensureHtml(body)
  const hasIntro = Boolean(introHtml)
  const hasBody = Boolean(bodyHtml)

  if (!hasIntro && !hasBody) {
    return <p className="ballot-measure-placeholder">Details coming soon.</p>
  }

  return (
    <div className="ballot-measure-details">
      {hasIntro && (
        <div className="ballot-measure-card ballot-measure-intro" dangerouslySetInnerHTML={{ __html: introHtml as string }} />
      )}
      {hasBody && (
        <div className="ballot-measure-card ballot-measure-body" dangerouslySetInnerHTML={{ __html: bodyHtml as string }} />
      )}
    </div>
  )
}

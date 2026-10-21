export interface ReportedEndorsementEntry {
  id: string
  endorser: string
  category?: string | null
  position?: number | null
}

interface ReportedEndorsementsProps {
  endorsements?: ReportedEndorsementEntry[] | null
  limit?: number
  // The full-page cards supply their own heading
  showTitle?: boolean
}

const CATEGORY_PRIORITY: Record<string, number> = {
  CURRENT_OFFICIAL: 0,
  FORMER_OFFICIAL: 1,
  ORGANIZATION: 2,
  INDIVIDUAL: 3,
}

// The queries already return this order; sorting again keeps callers that
// build the list some other way from showing it out of priority
export function sortReportedEndorsements<T extends ReportedEndorsementEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const categoryA = CATEGORY_PRIORITY[a.category ?? ''] ?? Number.MAX_SAFE_INTEGER
    const categoryB = CATEGORY_PRIORITY[b.category ?? ''] ?? Number.MAX_SAFE_INTEGER
    if (categoryA !== categoryB) return categoryA - categoryB
    return (a.position ?? 0) - (b.position ?? 0)
  })
}

export function ReportedEndorsementsTitle({ as: Tag = 'h4' }: { as?: 'h3' | 'h4' }) {
  return (
    // An h3 sits in a card heading that already styles it
    <Tag className={Tag === 'h4' ? 'reported-endorsements-title' : undefined}>
      Endorsements{' '}
      <button
        type="button"
        className="info-tip"
        aria-label="Candidate-reported"
        data-tip="Candidate-reported"
      >
        ⓘ
      </button>
    </Tag>
  )
}

export function CandidateReportedEndorsements({
  endorsements,
  limit,
  showTitle = true,
}: ReportedEndorsementsProps) {
  if (!endorsements || endorsements.length === 0) {
    return null
  }

  const ordered = sortReportedEndorsements(endorsements)
  const shown = typeof limit === 'number' ? ordered.slice(0, limit) : ordered
  // Unlike the donor line, nothing else on the card says the list was cut
  const hidden = ordered.length - shown.length

  return (
    <div className="reported-endorsements">
      {showTitle && <ReportedEndorsementsTitle />}
      <p>
        {shown.map(entry => (
          <span key={entry.id} className="topdonors">
            {entry.endorser}
          </span>
        ))}
        {hidden > 0 && <span className="topdonors">{hidden} more</span>}
      </p>
    </div>
  )
}

interface EndorsementProps {
  endorsements: Array<{
    id: string
    endorser: string
    url?: string | null
    filePath?: string | null
    sourceTitle?: string | null
    notes?: string | null
    type: string
    forAgainst: string
  }>
  showPlaceholder?: boolean
  stance?: 'MEASURE_YES' | 'MEASURE_NO'
}

type DisplayVariant = 'yes' | 'no'

export function CandidateEndorsements({ endorsements, showPlaceholder = true, stance }: EndorsementProps) {
  const displayList = computeDisplayList(endorsements, stance)

  if (displayList.length === 0) {
    if (!showPlaceholder) {
      return null
    }

    return (
      <div className="endorsements-summary">
        <p>No letters of support or opposition listed yet.</p>
      </div>
    )
  }

  return (
    <div className="endorsements-summary">
      <ul className="recs">
        {displayList.map(item => (
          <li key={item.id} className={item.variant === 'yes' ? 'yes' : 'no'}>
            <EndorsementLink endorsement={item.endorsement} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function computeDisplayList(
  endorsements: EndorsementProps['endorsements'],
  stance: EndorsementProps['stance']
): Array<{ id: string; endorsement: EndorsementProps['endorsements'][number]; variant: DisplayVariant }> {
  if (endorsements.length === 0) {
    return []
  }

  if (stance === 'MEASURE_YES') {
    return endorsements
      .filter(entry => entry.forAgainst === 'FOR')
      .map(entry => ({ id: entry.id, endorsement: entry, variant: 'yes' as DisplayVariant }))
  }

  if (stance === 'MEASURE_NO') {
    return endorsements
      .filter(entry => entry.forAgainst === 'AGAINST')
      .map(entry => ({ id: entry.id, endorsement: entry, variant: 'yes' as DisplayVariant }))
  }

  // Sort endorsements: FOR first, then AGAINST
  // Within each group, prioritize petition entry (3,800 petitioners), then by ID/date
  const sorted = [...endorsements].sort((a, b) => {
    // Primary sort: FOR before AGAINST
    if (a.forAgainst === 'FOR' && b.forAgainst === 'AGAINST') return -1
    if (a.forAgainst === 'AGAINST' && b.forAgainst === 'FOR') return 1

    // Within same forAgainst group, prioritize petition entry
    const isPetitionA = a.endorser.includes('3,800') || a.endorser.includes('Petitioner')
    const isPetitionB = b.endorser.includes('3,800') || b.endorser.includes('Petitioner')

    if (isPetitionA && !isPetitionB) return -1
    if (!isPetitionA && isPetitionB) return 1

    // Otherwise maintain original order (by ID creation order)
    return a.id.localeCompare(b.id)
  })

  return sorted.map(entry => ({
    id: entry.id,
    endorsement: entry,
    variant: entry.forAgainst === 'FOR' ? 'yes' : 'no'
  }))
}

function EndorsementLink({
  endorsement
}: {
  endorsement: {
    id: string
    endorser: string
    url?: string | null
    filePath?: string | null
    sourceTitle?: string | null
    notes?: string | null
  }
}) {
  const href = endorsement.url || endorsement.filePath || null
  const label = endorsement.endorser
  const secondary = endorsement.sourceTitle || endorsement.notes || null
  const isPetition = label.includes('3,800') || label.includes('Petitioner')

  return (
    <div className={`endorsement-item${isPetition ? ' endorsement-petition' : ''}`}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ) : (
        <span>{label}</span>
      )}
      {secondary && (
        <span className="endorsement-meta"> — {secondary}</span>
      )}
    </div>
  )
}

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
}

export function CandidateEndorsements({ endorsements, showPlaceholder = true }: EndorsementProps) {
  const endorsementsFor = endorsements.filter(e => e.forAgainst === 'FOR')
  const endorsementsAgainst = endorsements.filter(e => e.forAgainst === 'AGAINST')
  
  if (endorsements.length === 0) {
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
      <h4>Endorsements and letters</h4>
      <ul className="recs">
        {endorsementsFor.map(endorsement => (
          <li key={endorsement.id} className="yes">
            <EndorsementLink endorsement={endorsement} />
          </li>
        ))}
        {endorsementsAgainst.map(endorsement => (
          <li key={endorsement.id} className="no">
            <EndorsementLink endorsement={endorsement} />
          </li>
        ))}
      </ul>
    </div>
  )
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

  return (
    <div className="endorsement-item">
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

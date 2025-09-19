interface EndorsementProps {
  endorsements: Array<{
    id: string
    endorser: string
    url: string
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
            <a href={endorsement.url} target="_blank" rel="noopener noreferrer">
              {endorsement.endorser}
            </a>
          </li>
        ))}
        {endorsementsAgainst.map(endorsement => (
          <li key={endorsement.id} className="no">
            <a href={endorsement.url} target="_blank" rel="noopener noreferrer">
              {endorsement.endorser}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

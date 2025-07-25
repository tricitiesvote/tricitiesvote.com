import Link from 'next/link'
import Image from 'next/image'
import { CandidateDonorSummary } from './CandidateDonorSummary'

interface CandidateMiniProps {
  candidate: {
    id: string
    name: string
    image?: string | null
    minifiler: boolean
    engagement?: string | null
    endorsements?: Array<{
      id: string
      endorser: string
      url: string
      type: string
      forAgainst: string
    }>
  }
  fundraising?: {
    total: number
    donors: number
    topDonors: Array<{
      name: string
      amount: number
    }>
  } | null
  year: number
}

export function CandidateMini({ candidate, fundraising, year }: CandidateMiniProps) {
  // Create a slug from candidate name
  const candidateSlug = candidate.name.toLowerCase().replace(/\s+/g, '-')
  const url = `/${year}/candidate/${candidateSlug}`
  
  // Group endorsements by for/against
  const endorsementsFor = candidate.endorsements?.filter(e => e.forAgainst === 'FOR') || []
  const endorsementsAgainst = candidate.endorsements?.filter(e => e.forAgainst === 'AGAINST') || []
  
  return (
    <div className="candidate candidate-mini">
      <Link href={url}>
        {candidate.image ? (
          <img 
            src={candidate.image} 
            alt={candidate.name}
            width={150}
            height={150}
          />
        ) : (
          <div className="candidate-no-image">
            <span>{candidate.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
        )}
      </Link>
      
      <h5>
        <Link href={url}>{candidate.name}</Link>
      </h5>
      
      {candidate.engagement && (
        <div className="engagement" dangerouslySetInnerHTML={{ __html: candidate.engagement }} />
      )}
      
      <CandidateDonorSummary
        fundraising={fundraising}
        minifiler={candidate.minifiler}
        mini={true}
      />
      
      {(endorsementsFor.length > 0 || endorsementsAgainst.length > 0) && (
        <div className="endorsements-summary">
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
      )}
      
      {!endorsementsFor.length && !endorsementsAgainst.length && (
        <div className="endorsements-summary">
          <p>No letters of support or opposition listed yet.</p>
        </div>
      )}
      
      <Link className="fullLink" href={url}>
        View full profile »
      </Link>
    </div>
  )
}
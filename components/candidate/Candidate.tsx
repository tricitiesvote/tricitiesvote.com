import Link from 'next/link'
import { CandidateInfo } from './CandidateInfo'
import { CandidateEndorsements } from './CandidateEndorsements'
import { CandidateDonorSummary } from './CandidateDonorSummary'
import { slugify } from '@/lib/utils'

interface CandidateProps {
  candidate: {
    id: string
    name: string
    image?: string | null
    email?: string | null
    website?: string | null
    facebook?: string | null
    twitter?: string | null
    instagram?: string | null
    youtube?: string | null
    pdc?: string | null
    minifiler: boolean
    bio?: string | null
    statement?: string | null
    engagement?: string | null
    articles?: string | null
    electionYear: number
    office: {
      title: string
      jobTitle: string
    }
    endorsements?: Array<{
      id: string
      endorser: string
      url: string
      type: string
      forAgainst: string
    }>
  }
  year: number
  fullsize?: boolean
  fundraising?: {
    total: number
    donors: number
    topDonors: Array<{
      name: string
      amount: number
    }>
  } | null
}

export function Candidate({ candidate, year, fullsize = false, fundraising }: CandidateProps) {
  const candidateSlug = slugify(candidate.name)
  const url = `/${year}/candidate/${candidateSlug}`
  
  const hasBio = Boolean(candidate.bio)
  const hasStatement = Boolean(candidate.statement)
  
  return (
    <div className="candidate">
      {/* Info column (image and links) - comes first in HTML but displayed on left via grid */}
      <div className="info">
        <CandidateInfo
          candidate={candidate}
          year={year}
        />
      </div>
      
      {/* Details column (main content) */}
      <div className="details">
        <h5>
          <Link href={url}>{candidate.name}</Link>
        </h5>

        {!fullsize && (
          <>
            {hasBio ? (
              <div className="candidate-body" dangerouslySetInnerHTML={{ __html: candidate.bio! }} />
            ) : hasStatement ? (
              <div className="candidate-bio excerpt">
                <div dangerouslySetInnerHTML={{ __html: candidate.statement! }} />
                <Link href={url} className="candidate-link">
                  More »
                </Link>
              </div>
            ) : (
              <div className="candidate-bio placeholder">
                <p>Statement N/A.</p>
              </div>
            )}
          </>
        )}

        {candidate.engagement && (
          <div className="engagement" dangerouslySetInnerHTML={{ __html: candidate.engagement }} />
        )}

        <CandidateEndorsements endorsements={candidate.endorsements || []} />
        
        {candidate.articles && (
          <div className="candidate-articles news">
            <h4>News Articles</h4>
            <div dangerouslySetInnerHTML={{ __html: candidate.articles }} />
          </div>
        )}
        
        {!fullsize && (
          <div>
            {/* Body excerpt would go here if we had it */}
            <CandidateDonorSummary
              fundraising={fundraising}
              minifiler={candidate.minifiler}
              mini={true}
            />
          </div>
        )}
        
        {!fullsize && (
          <p>
            <a href={url}>See full candidate details »</a>
          </p>
        )}
      </div>
      
      {/* Full candidate content area - spans both columns */}
      {fullsize && (
        <div className="candidate-content">
          {hasBio ? (
            <div className="candidate-body" dangerouslySetInnerHTML={{ __html: candidate.bio! }} />
          ) : hasStatement ? (
            <div className="candidate-body" dangerouslySetInnerHTML={{ __html: candidate.statement! }} />
          ) : (
            <div className="candidate-body placeholder">
              <p>Statement N/A.</p>
            </div>
          )}

          {/* Questionnaire answers would go here */}

          <CandidateDonorSummary
            fundraising={fundraising}
            minifiler={candidate.minifiler}
            mini={false}
          />
        </div>
      )}
    </div>
  )
}

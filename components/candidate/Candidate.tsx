import Link from 'next/link'
import { CandidateInfo } from './CandidateInfo'
import { CandidateEndorsements } from './CandidateEndorsements'
import { CandidateDonorSummary } from './CandidateDonorSummary'
import { slugify } from '@/lib/utils'
import { ensureHtml } from '@/lib/richText'

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
  
  const bioHtml = ensureHtml(candidate.bio)
  const statementHtml = ensureHtml(candidate.statement)
  const engagementHtml = ensureHtml(candidate.engagement)
  const articlesHtml = ensureHtml(candidate.articles)
  const hasBio = Boolean(bioHtml)
  const hasStatement = Boolean(statementHtml)

  const primaryContent = hasBio
    ? <div className="candidate-body" dangerouslySetInnerHTML={{ __html: bioHtml! }} />
    : hasStatement
      ? <div className="candidate-body" dangerouslySetInnerHTML={{ __html: statementHtml! }} />
      : (
        <div className="candidate-body placeholder">
          <p>Statement N/A.</p>
        </div>
      )

  if (fullsize) {
    return (
      <article className="candidate candidate-full">
        <div className="info">
          <CandidateInfo
            candidate={candidate}
            year={year}
            size={100}
          />
        </div>

        <div className="details">
          <h3>{candidate.name}</h3>
          {primaryContent}
        </div>

        <div className="candidate-expanded">
          {engagementHtml && (
            <div className="engagement" dangerouslySetInnerHTML={{ __html: engagementHtml }} />
          )}

          {candidate.endorsements && candidate.endorsements.length > 0 && (
            <CandidateEndorsements endorsements={candidate.endorsements} showPlaceholder={false} />
          )}

          {articlesHtml && (
            <div className="candidate-articles news">
              <h4>News Articles</h4>
              <div dangerouslySetInnerHTML={{ __html: articlesHtml }} />
            </div>
          )}

          <CandidateDonorSummary
            fundraising={fundraising}
            minifiler={candidate.minifiler}
            mini={false}
          />
        </div>
      </article>
    )
  }

  return (
    <div className="candidate">
      {/* Info column (image and links) - comes first in HTML but displayed on left via grid */}
      <div className="info">
        <CandidateInfo
          candidate={candidate}
          year={year}
          size={150}
        />
      </div>
      
      {/* Details column (main content) */}
      <div className="details">
        <h5>
          <Link href={url}>{candidate.name}</Link>
        </h5>

        {hasBio ? (
          <div className="candidate-body" dangerouslySetInnerHTML={{ __html: bioHtml! }} />
        ) : hasStatement ? (
          <div className="candidate-bio excerpt">
            <div dangerouslySetInnerHTML={{ __html: statementHtml! }} />
            <Link href={url} className="candidate-link">
              More »
            </Link>
          </div>
        ) : (
          <div className="candidate-bio placeholder">
            <p>Statement N/A.</p>
          </div>
        )}

        {engagementHtml && (
          <div className="engagement" dangerouslySetInnerHTML={{ __html: engagementHtml }} />
        )}

        <CandidateEndorsements endorsements={candidate.endorsements || []} />
        
        {articlesHtml && (
          <div className="candidate-articles news">
            <h4>News Articles</h4>
            <div dangerouslySetInnerHTML={{ __html: articlesHtml }} />
          </div>
        )}
        
        <div>
          <CandidateDonorSummary
            fundraising={fundraising}
            minifiler={candidate.minifiler}
            mini={true}
          />
        </div>
        
        <p>
          <a href={url}>See full candidate details »</a>
        </p>
      </div>
    </div>
  )
}

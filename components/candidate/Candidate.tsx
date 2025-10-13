import Link from 'next/link'
import { CandidateInfo } from './CandidateInfo'
import { CandidateEndorsements } from './CandidateEndorsements'
import { CandidateDonorSummary } from './CandidateDonorSummary'
import { CandidateEnforcementCases } from './CandidateEnforcementCases'
import { slugify } from '@/lib/utils'
import { ensureHtml } from '@/lib/richText'
import { EditableField } from '@/components/wiki/EditableField'
import { preferWikiString } from '@/lib/wiki/utils'

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
    enforcementCases?: Array<{
      id: string
      caseNumber: string
      opened: Date
      subject: string
      status: string
      areasOfLaw: string
      url: string
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
  const displayName = preferWikiString(candidate as any, 'name') ?? candidate.name
  const candidateSlug = slugify(candidate.name)
  const url = `/${year}/candidate/${candidateSlug}`
  
  const bioValue = preferWikiString(candidate as any, 'bio')
  const statementValue = preferWikiString(candidate as any, 'statement')
  const engagementValue = preferWikiString(candidate as any, 'engagement')
  const articlesValue = preferWikiString(candidate as any, 'articles')
  const bioHtml = ensureHtml(bioValue)
  const statementHtml = ensureHtml(statementValue)
  const engagementHtml = ensureHtml(engagementValue)
  const articlesHtml = ensureHtml(articlesValue)
  const hasBio = Boolean(bioHtml)
  const hasStatement = Boolean(statementHtml)

  const renderRichText = (
    value: string | null,
    placeholder: string,
    className = 'candidate-body',
    placeholderClassName = 'candidate-body placeholder'
  ) => {
    const html = ensureHtml(value)
    if (!html) {
      return (
        <div className={placeholderClassName}>
          <p>{placeholder}</p>
        </div>
      )
    }
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  }

  const statementDisplay = renderRichText(statementValue, 'Statement N/A.')
  const bioDisplay = renderRichText(bioValue, 'Biography N/A.')
  const engagementDisplay = renderRichText(
    engagementValue,
    'Awaiting engagement details.',
    'engagement'
  )
  const articlesDisplay = renderRichText(
    articlesValue,
    'No articles listed.',
    'candidate-articles news'
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
          <h3>
            <EditableField
              entityType="CANDIDATE"
              entityId={candidate.id}
              field="name"
              value={displayName ?? ''}
              placeholder="Name unavailable"
              className="inline"
              as="span"
            />
          </h3>

          <section className="candidate-section">
            <h4>Candidate Statement</h4>
            <EditableField
              entityType="CANDIDATE"
              entityId={candidate.id}
              field="statement"
              value={statementValue ?? ''}
              placeholder="Statement N/A."
              multiline
            >
              {statementDisplay}
            </EditableField>
          </section>

          <section className="candidate-section">
            <h4>Biography</h4>
            <EditableField
              entityType="CANDIDATE"
              entityId={candidate.id}
              field="bio"
              value={bioValue ?? ''}
              placeholder="Biography N/A."
              multiline
            >
              {bioDisplay}
            </EditableField>
          </section>
        </div>

        <div className="candidate-expanded">
          <section className="candidate-section">
            <h4>Community Engagement</h4>
            <EditableField
              entityType="CANDIDATE"
              entityId={candidate.id}
              field="engagement"
              value={engagementValue ?? ''}
              placeholder="Awaiting engagement details."
              multiline
            >
              {engagementDisplay}
            </EditableField>
          </section>

          {candidate.endorsements && candidate.endorsements.length > 0 && (
            <CandidateEndorsements endorsements={candidate.endorsements} showPlaceholder={false} />
          )}

          {/* <CandidateEnforcementCases cases={candidate.enforcementCases || []} /> */}

          <section className="candidate-section">
            <h4>News Articles</h4>
            <EditableField
              entityType="CANDIDATE"
              entityId={candidate.id}
              field="articles"
              value={articlesValue ?? ''}
              placeholder="No articles listed."
              multiline
            >
              {articlesDisplay}
            </EditableField>
          </section>

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
          <Link href={url}>{displayName}</Link>
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

        {/* <CandidateEnforcementCases cases={candidate.enforcementCases || []} /> */}

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

'use client';

import Link from 'next/link'
import { CandidateInfo } from './CandidateInfo'
import { CandidateEndorsements } from './CandidateEndorsements'
import { CandidateDonorSummary } from './CandidateDonorSummary'
import { CandidateEnforcementCases } from './CandidateEnforcementCases'
import { EditableCandidateEndorsements } from '@/components/wiki/EditableCandidateEndorsements'
import { CandidateEngagementList } from './CandidateEngagementList'
import { slugify } from '@/lib/utils'
import { ensureHtml } from '@/lib/richText'
import { EditableField } from '@/components/wiki/EditableField'
import { EditableSectionTitle } from '@/components/wiki/EditableSectionTitle'
import { EditableCandidateEngagements } from '@/components/wiki/EditableCandidateEngagements'
import { preferWikiString } from '@/lib/wiki/utils'
import { useEditMode } from '@/lib/wiki/EditModeProvider'
import { useAuth } from '@/lib/auth/AuthProvider'

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
    engagements?: Array<{
      participated: boolean
      notes?: string | null
      link?: string | null
      engagement: {
        id: string
        slug: string
        title: string
        date?: Date | string | null
        primaryLink?: string | null
        secondaryLink?: string | null
        secondaryLinkTitle?: string | null
        notes?: string | null
      } | null
    }>
    races?: Array<{
      race: {
        id: string
        electionYear: number
      }
    }>
    office: {
      title: string
      jobTitle: string
    }
    endorsements?: Array<{
      id: string
      endorser: string
      url?: string | null
      filePath?: string | null
      sourceTitle?: string | null
      notes?: string | null
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
  const { editMode } = useEditMode();
  const { user } = useAuth();
  const showEditControls = editMode && user;

  const displayName = preferWikiString(candidate as any, 'name') ?? candidate.name
  const candidateSlug = slugify(candidate.name)
  const url = `/${year}/candidate/${candidateSlug}`

  const bioValue = preferWikiString(candidate as any, 'bio')
  const statementValue = preferWikiString(candidate as any, 'statement')
  const engagementValue = preferWikiString(candidate as any, 'engagement')
  const articlesValue = preferWikiString(candidate as any, 'articles')
  const bioHtml = ensureHtml(bioValue)
  const statementHtml = ensureHtml(statementValue)
  const structuredEngagements = Array.isArray(candidate.engagements)
    ? candidate.engagements.filter(entry => entry.engagement)
    : []
  const legacyEngagementHtml = ensureHtml(engagementValue)
  const articlesHtml = ensureHtml(articlesValue)
  const hasBio = Boolean(bioHtml)
  const hasStatement = Boolean(statementHtml)
  const hasEngagement = structuredEngagements.length > 0 || Boolean(legacyEngagementHtml)
  const hasArticles = Boolean(articlesHtml)

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
  const engagementDisplay = structuredEngagements.length > 0
    ? <CandidateEngagementList entries={structuredEngagements} />
    : renderRichText(engagementValue, 'Awaiting engagement details.', 'engagement')
  const articlesDisplay = renderRichText(
    articlesValue,
    'No articles listed.',
    'candidate-articles news'
  )

  // Get race ID for engagement editing
  const currentRace = candidate.races?.find(r => r.race.electionYear === year)
  const raceId = currentRace?.race.id || null

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
          <h3>{displayName}</h3>

          {statementHtml && (
            <section className="candidate-section">
              <h4>Candidate Statement</h4>
              <div className="candidate-body" dangerouslySetInnerHTML={{ __html: statementHtml }} />
            </section>
          )}
        </div>

        <div className="candidate-expanded">
          {(hasEngagement || showEditControls) && (
            <section className="candidate-section">
              {structuredEngagements.length > 0 ? (
                <>
                  <h4>Community Engagement</h4>
                  <EditableCandidateEngagements
                    candidateId={candidate.id}
                    electionYear={candidate.electionYear}
                    raceId={raceId}
                    currentEngagements={structuredEngagements}
                  />
                  {legacyEngagementHtml && (
                    <div className="candidate-body legacy-engagement" dangerouslySetInnerHTML={{ __html: legacyEngagementHtml }} />
                  )}
                </>
              ) : (
                <>
                  <EditableSectionTitle
                    title="Community Engagement"
                    entityType="CANDIDATE"
                    entityId={candidate.id}
                    field="engagement"
                    value={engagementValue ?? ''}
                    label="Community Engagement"
                    multiline
                  />
                  {engagementDisplay}
                </>
              )}
            </section>
          )}

          <CandidateEndorsements endorsements={candidate.endorsements || []} />
          <EditableCandidateEndorsements candidateId={candidate.id} />

          {/* <CandidateEnforcementCases cases={candidate.enforcementCases || []} /> */}

          {(hasArticles || showEditControls) && (
            <section className="candidate-section">
              <EditableSectionTitle
                title="News Articles"
              entityType="CANDIDATE"
              entityId={candidate.id}
              field="articles"
              value={articlesValue ?? ''}
              label="News Articles"
              multiline
              renderTrigger={openModal => (
                <button
                  type="button"
                  className="wiki-trigger-button"
                  onClick={event => {
                    event.stopPropagation();
                    openModal();
                  }}
                >
                  Add news article
                </button>
              )}
            />
            {articlesDisplay}
          </section>
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

        {structuredEngagements.length > 0 ? (
          <CandidateEngagementList entries={structuredEngagements} variant="compact" />
        ) : (
          legacyEngagementHtml && (
            <div className="engagement" dangerouslySetInnerHTML={{ __html: legacyEngagementHtml }} />
          )
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

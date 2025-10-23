'use client';

import Link from 'next/link'
import { CandidateImage } from './CandidateImage'
import { CandidateLinkCollection } from './CandidateLinkCollection'
import { CandidateEndorsements } from './CandidateEndorsements'
import { CandidateDonorSummary } from './CandidateDonorSummary'
import { EditableCandidateEndorsements } from '@/components/wiki/EditableCandidateEndorsements'
import { CandidateEngagementList } from './CandidateEngagementList'
import { CandidateInfo } from './CandidateInfo'
import { slugify } from '@/lib/utils'
import { ensureHtml } from '@/lib/richText'
import { EditableSectionTitle } from '@/components/wiki/EditableSectionTitle'
import { EditableCandidateEngagements } from '@/components/wiki/EditableCandidateEngagements'
import { preferWikiString } from '@/lib/wiki/utils'
import { useEditMode } from '@/lib/wiki/EditModeProvider'
import { useAuth } from '@/lib/auth/AuthProvider'
import { deriveMeasureStance } from './measureUtils'

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
      type?: string
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
    totalCash?: number
    totalInKind?: number
  } | null
}

export function Candidate({ candidate, year, fullsize = false, fundraising }: CandidateProps) {
  const { editMode } = useEditMode();
  const { user } = useAuth();
  const showEditControls = editMode && user;

  const displayName = preferWikiString(candidate as any, 'name') ?? candidate.name
  const candidateSlug = slugify(candidate.name)
  const url = `/${year}/candidate/${candidateSlug}`

  const imageValue = preferWikiString(candidate as any, 'image') ?? candidate.image ?? null
  const statementValue = preferWikiString(candidate as any, 'statement')
  const statementHtml = ensureHtml(statementValue)
  const bioValue = preferWikiString(candidate as any, 'bio')
  const bioHtml = ensureHtml(bioValue)
  const engagementValue = preferWikiString(candidate as any, 'engagement')
  const articlesValue = preferWikiString(candidate as any, 'articles')
  const legacyEngagementHtml = ensureHtml(engagementValue)
  const articlesHtml = ensureHtml(articlesValue)
  const structuredEngagements = Array.isArray(candidate.engagements)
    ? candidate.engagements.filter(entry => entry.engagement)
    : []
  const hasBio = Boolean(bioHtml)
  const hasStatement = Boolean(statementHtml)

  const emailValue = preferWikiString(candidate as any, 'email') ?? candidate.email
  const websiteValue = preferWikiString(candidate as any, 'website') ?? candidate.website
  const facebookValue = preferWikiString(candidate as any, 'facebook') ?? candidate.facebook
  const twitterValue = preferWikiString(candidate as any, 'twitter') ?? candidate.twitter
  const instagramValue = preferWikiString(candidate as any, 'instagram') ?? candidate.instagram
  const youtubeValue = preferWikiString(candidate as any, 'youtube') ?? candidate.youtube
  const phoneValue = preferWikiString(candidate as any, 'phone')

  const currentRace = candidate.races?.find(r => r.race.electionYear === year)
  const raceId = currentRace?.race.id || null
  const officeType = candidate.office?.type
  const isBallotMeasureCandidate = officeType === 'BALLOT_MEASURE'
  const measureStance = isBallotMeasureCandidate
    ? (deriveMeasureStance(displayName) ?? deriveMeasureStance(candidate.name))
    : null
  const measureBadge = measureStance
    ? {
        label: measureStance === 'support' ? 'YES' : 'NO',
        backgroundColor: '#53bce4'
      }
    : null
  const endorsementStance = measureStance === 'support'
    ? 'MEASURE_YES'
    : measureStance === 'oppose'
      ? 'MEASURE_NO'
      : undefined

  if (fullsize) {
    const statementContent = statementHtml ? (
      <div className="candidate-card-text" dangerouslySetInnerHTML={{ __html: statementHtml }} />
    ) : (
      <p className="candidate-card-placeholder">Statement N/A.</p>
    )

    const engagementContent = structuredEngagements.length > 0 ? (
      <CandidateEngagementList entries={structuredEngagements} />
    ) : legacyEngagementHtml ? (
      <div className="candidate-card-text" dangerouslySetInnerHTML={{ __html: legacyEngagementHtml }} />
    ) : (
      <p className="candidate-card-placeholder">Awaiting engagement details.</p>
    )

    return (
      <article className="candidate-profile">
        <section className="candidate-card candidate-card--statement">
          <div className="candidate-card-heading candidate-card-heading--center">
            <CandidateImage name={displayName} image={imageValue} url={url} size={140} badge={measureBadge} />
            <h2>{displayName}</h2>
          </div>

          <div className="candidate-card-divider" />

          <div className="candidate-card-contact">
            <CandidateLinkCollection
              candidateId={candidate.id}
              email={emailValue}
              website={websiteValue}
              facebook={facebookValue}
              twitter={twitterValue}
              instagram={instagramValue}
              youtube={youtubeValue}
              pdc={candidate.pdc}
              phone={phoneValue}
              variant="inline"
            />
          </div>

          <div className="candidate-card-divider" />

          <div className="candidate-card-body">
            {statementContent}
          </div>
        </section>

        {!isBallotMeasureCandidate && (
          <section className="candidate-card candidate-card--engagement">
            <div className="candidate-card-heading">
              <h3>Community Engagement</h3>
            </div>

            <div className="candidate-card-body">
              {(structuredEngagements.length > 0 || showEditControls) && (
                <EditableCandidateEngagements
                  candidateId={candidate.id}
                  electionYear={candidate.electionYear}
                  raceId={raceId}
                  currentEngagements={structuredEngagements}
                />
              )}
              {engagementContent}
            </div>
          </section>
        )}

       <section className="candidate-card candidate-card--support">
         <div className="candidate-card-heading">
           <h3>Endorsements</h3>
         </div>

          <div className="candidate-card-body">
            <CandidateEndorsements
              endorsements={candidate.endorsements || []}
              showPlaceholder={!showEditControls}
            />
            <EditableCandidateEndorsements candidateId={candidate.id} />
          </div>
        </section>

        <section className="candidate-card candidate-card--donors">
          <div className="candidate-card-heading">
            <h3>Donors</h3>
          </div>
          <div className="candidate-card-body">
            <CandidateDonorSummary
              fundraising={fundraising}
              minifiler={candidate.minifiler}
              mini={false}
            />
          </div>
        </section>

        {(articlesHtml || showEditControls) && (
          <section className="candidate-card candidate-card--articles">
            <div className="candidate-card-heading">
              <h3>News &amp; Articles</h3>
            </div>
            <div className="candidate-card-body">
              <EditableSectionTitle
                title="News & Articles"
                entityType="CANDIDATE"
                entityId={candidate.id}
                field="articles"
                value={articlesValue ?? ''}
                label="News & Articles"
                multiline
              />
              {articlesHtml ? (
                <div className="candidate-card-text" dangerouslySetInnerHTML={{ __html: articlesHtml }} />
              ) : (
                <p className="candidate-card-placeholder">No articles listed.</p>
              )}
            </div>
          </section>
        )}
      </article>
    )
  }

  return (
    <div className="candidate">
      <div className="info">
        <CandidateInfo
          candidate={candidate}
          badge={measureBadge}
          year={year}
          size={150}
        />
      </div>

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

        {!isBallotMeasureCandidate && (
          structuredEngagements.length > 0 ? (
            <CandidateEngagementList entries={structuredEngagements} variant="compact" />
          ) : (
            legacyEngagementHtml && (
              <div className="engagement" dangerouslySetInnerHTML={{ __html: legacyEngagementHtml }} />
            )
          )
        )}

        <CandidateEndorsements
          endorsements={candidate.endorsements || []}
        />

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

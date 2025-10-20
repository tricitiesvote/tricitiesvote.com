import Image from 'next/image'
import Link from 'next/link'
import { CandidateDonorSummary } from './CandidateDonorSummary'
import { CandidateEngagementList } from './CandidateEngagementList'
import { CandidateEndorsements } from './CandidateEndorsements'
import { slugify } from '@/lib/utils'
import { ensureHtml } from '@/lib/richText'
import { deriveMeasureStance } from './measureUtils'

interface CandidateMiniProps {
  candidate: {
    id: string
    name: string
    image?: string | null
    nameWiki?: string | null
    imageWiki?: string | null
    minifiler: boolean
    engagement?: string | null
    engagements?: Array<{
      participated: boolean
      notes?: string | null
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
    endorsements?: Array<{
      id: string
      endorser: string
      url?: string | null
      filePath?: string | null
      sourceTitle?: string | null
      notes?: string | null
      type?: string | null
      forAgainst?: string | null
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
  officeType?: string
}

export function CandidateMini({ candidate, fundraising, year, officeType }: CandidateMiniProps) {
  const displayName = candidate.nameWiki && candidate.nameWiki.trim().length > 0
    ? candidate.nameWiki
    : candidate.name
  const displayImage = candidate.imageWiki && candidate.imageWiki.trim().length > 0
    ? candidate.imageWiki
    : candidate.image
  const candidateSlug = slugify(candidate.name)
  const url = `/${year}/candidate/${candidateSlug}`
  const imageSrc = displayImage || null
  const structuredEngagements = Array.isArray(candidate.engagements)
    ? candidate.engagements.filter(entry => entry.engagement)
    : []
  const legacyEngagementHtml = ensureHtml(candidate.engagement)
  const isRemoteImage = imageSrc ? /^https?:/i.test(imageSrc) : false
  const isBallotMeasureCandidate = officeType === 'BALLOT_MEASURE'
  const measureStance = isBallotMeasureCandidate ? deriveMeasureStance(displayName) ?? deriveMeasureStance(candidate.name) : null
  const measureBadgeLabel = measureStance ? (measureStance === 'support' ? 'YES' : 'NO') : null
  const endorsementStance = measureStance === 'support'
    ? 'MEASURE_YES'
    : measureStance === 'oppose'
      ? 'MEASURE_NO'
      : undefined

  return (
    <div className="candidate candidate-mini">
      <Link href={url}>
        {measureBadgeLabel ? (
          <div className="candidate-measure-badge candidate-measure-badge--mini">
            <span>{measureBadgeLabel}</span>
          </div>
        ) : imageSrc ? (
          <Image
            src={imageSrc}
            alt={displayName}
            width={150}
            height={150}
            sizes="150px"
            unoptimized={isRemoteImage}
          />
        ) : (
          <div className="candidate-no-image">
            <span>{displayName.split(' ').map(n => n[0]).join('')}</span>
          </div>
        )}
      </Link>
      
      <h5>
        {displayName}
      </h5>
      
      {!isBallotMeasureCandidate && (
        structuredEngagements.length > 0 ? (
          <CandidateEngagementList entries={structuredEngagements} variant="compact" />
        ) : (
          legacyEngagementHtml && (
            <div className="engagement" dangerouslySetInnerHTML={{ __html: legacyEngagementHtml }} />
          )
        )
      )}
      
      <CandidateDonorSummary
        fundraising={fundraising}
        minifiler={candidate.minifiler}
        mini={true}
      />
      
      {endorsementStance ? (
        <div className="endorsements-summary">
          <p>No letters of support or opposition listed yet.</p>
        </div>
      ) : (
        <CandidateEndorsements
          endorsements={(candidate.endorsements as any) || []}
        />
      )}
    </div>
  )
}

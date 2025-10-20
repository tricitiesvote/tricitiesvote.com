import Image from 'next/image'
import Link from 'next/link'
import { CandidateDonorSummary } from './CandidateDonorSummary'
import { CandidateEngagementList } from './CandidateEngagementList'
import { slugify } from '@/lib/utils'
import { ensureHtml } from '@/lib/richText'

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

  // Group endorsements by for/against
  const endorsementsFor = candidate.endorsements?.filter(e => e.forAgainst === 'FOR') || []
  const endorsementsAgainst = candidate.endorsements?.filter(e => e.forAgainst === 'AGAINST') || []
  
  return (
    <div className="candidate candidate-mini">
      <Link href={url}>
        {imageSrc ? (
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
      
      {structuredEngagements.length > 0 ? (
        <CandidateEngagementList entries={structuredEngagements} variant="compact" />
      ) : (
        legacyEngagementHtml && (
          <div className="engagement" dangerouslySetInnerHTML={{ __html: legacyEngagementHtml }} />
        )
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
    </div>
  )
}

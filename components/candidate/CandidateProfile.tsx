import Image from 'next/image'
import Link from 'next/link'
import { ensureHtml } from '@/lib/richText'
import { preferWikiString } from '@/lib/wiki/utils'
import { EditableField } from '@/components/wiki/EditableField'
import { EditableCandidateEndorsements } from '@/components/wiki/EditableCandidateEndorsements'
import { CandidateEngagementList } from './CandidateEngagementList'
import { CandidateEndorsements } from './CandidateEndorsements'

interface CandidateProfileProps {
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
    articles?: string | null
    lettersYes?: string | null
    lettersNo?: string | null
    donors?: string | null
    office: {
      title: string
      type: string
    }
    races: Array<{
      race: {
        id: string
        electionYear: number
        office: {
          title: string
        }
        Guide?: Array<{
          region: {
            name: string
          }
        }>
      }
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
  year: number
}

export function CandidateProfile({ candidate, year }: CandidateProfileProps) {
  // Find the race for this year
  const currentRace = candidate.races.find(r => r.race.electionYear === year)
  const imageSrc = preferWikiString(candidate as any, 'image') ?? candidate.image ?? null
  const isRemoteImage = imageSrc ? /^https?:/i.test(imageSrc) : false
  const bioHtml = ensureHtml(candidate.bio)
  const statementHtml = ensureHtml(candidate.statement)
  const structuredEngagements = Array.isArray(candidate.engagements)
    ? candidate.engagements.filter(entry => entry.engagement)
    : []
  const legacyEngagementHtml = ensureHtml(candidate.engagement)
  const articlesValue = preferWikiString(candidate as any, 'articles') ?? ''
  const lettersYesHtml = ensureHtml(candidate.lettersYes)
  const lettersNoHtml = ensureHtml(candidate.lettersNo)
  
  // Group endorsements by for/against
  return (
    <div className="container-candidate-large">
      {currentRace?.race.Guide && currentRace.race.Guide.length > 0 && (
        <div className="breadcrumb">
          <Link href={`/${year}`}>{year} Election</Link> &gt;{' '}
          <Link href={`/${year}/guide/${currentRace.race.Guide[0].region.name.toLowerCase().replace(/\s+/g, '-')}`}>
            {currentRace.race.Guide[0].region.name} Guide
          </Link> &gt;{' '}
          {(currentRace?.race.office && preferWikiString(currentRace.race.office as any, 'title')) ?? currentRace?.race.office.title} &gt;{' '}
          {preferWikiString(candidate as any, 'name') ?? candidate.name}
        </div>
      )}
      
      <div className="candidate">
        <div className="info">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={candidate.name}
              width={150}
              height={150}
              sizes="150px"
              unoptimized={isRemoteImage}
            />
          ) : (
            <div className="candidate-no-image">
              <span>{candidate.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
          )}
          
          <h5>{candidate.name}</h5>
          
          <ul className="candidate-links">
            {candidate.email && (
              <li>
                <a href={`mailto:${candidate.email}`}>Email</a>
              </li>
            )}
            {candidate.website && (
              <li>
                <a href={candidate.website} target="_blank" rel="noopener noreferrer">Website</a>
              </li>
            )}
            {candidate.facebook && (
              <li>
                <a href={candidate.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
              </li>
            )}
            {candidate.twitter && (
              <li>
                <a href={candidate.twitter} target="_blank" rel="noopener noreferrer">Twitter</a>
              </li>
            )}
            {candidate.instagram && (
              <li>
                <a href={candidate.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
              </li>
            )}
            {candidate.youtube && (
              <li>
                <a href={candidate.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
              </li>
            )}
            {candidate.pdc && (
              <li>
                <a href={candidate.pdc} target="_blank" rel="noopener noreferrer">Campaign Finance (PDC)</a>
              </li>
            )}
          </ul>
        </div>
        
        <div className="details">
          <h5>{candidate.name}</h5>
          {bioHtml && (
            <div className="candidate-bio" dangerouslySetInnerHTML={{ __html: bioHtml }} />
          )}
          {!bioHtml && statementHtml && (
            <div className="candidate-statement" dangerouslySetInnerHTML={{ __html: statementHtml }} />
          )}
          
          {(structuredEngagements.length > 0 || legacyEngagementHtml) && (
            <div className="engagement">
              {structuredEngagements.length > 0 && (
                <CandidateEngagementList entries={structuredEngagements} />
              )}
              {legacyEngagementHtml && (
                <div dangerouslySetInnerHTML={{ __html: legacyEngagementHtml }} />
              )}
            </div>
          )}
          
          <CandidateEndorsements
            endorsements={candidate.endorsements || []}
            showPlaceholder={true}
          />
          <EditableCandidateEndorsements candidateId={candidate.id} />

          <div className="candidate-articles">
            <div className="candidate-articles-header">
              <h4>News Articles</h4>
            </div>
            <EditableField
              entityType="CANDIDATE"
              entityId={candidate.id}
              field="articles"
              value={articlesValue}
              placeholder="No articles listed."
              label="News Articles"
              multiline
              renderDisplay={(value) => {
                const html = ensureHtml(value);
                if (!html) {
                  return <span className="text-gray-500">No articles listed.</span>;
                }
                return <div className="candidate-articles-content" dangerouslySetInnerHTML={{ __html: html }} />;
              }}
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
          </div>
          
          {lettersYesHtml && (
            <div className="letters-yes">
              <h4>Letters of Support</h4>
              <div dangerouslySetInnerHTML={{ __html: lettersYesHtml }} />
            </div>
          )}
          
          {lettersNoHtml && (
            <div className="letters-no">
              <h4>Letters of Opposition</h4>
              <div dangerouslySetInnerHTML={{ __html: lettersNoHtml }} />
            </div>
          )}
        </div>
        
        <div className="candidate-content">
          {candidate.donors && !candidate.minifiler && (
            <div className="donor-summary">
              <h3>Campaign Finance</h3>
              <div dangerouslySetInnerHTML={{ __html: candidate.donors }} />
            </div>
          )}
          
          {candidate.minifiler && (
            <div className="donor-summary">
              <h3>Campaign Finance</h3>
              <p>This candidate is a mini-filer or self-funded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

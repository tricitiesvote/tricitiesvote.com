import Link from 'next/link'
import Image from 'next/image'
import { slugify } from '@/lib/utils'
import { preferWikiString } from '@/lib/wiki/utils'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { MetricPopover } from './MetricPopover'
import type { StoryWithCitations } from '@/lib/queries'

interface GridCandidate {
  candidate: {
    id: string
    name: string
    nameWiki?: string | null
    image?: string | null
    imageWiki?: string | null
    email?: string | null
    website?: string | null
    minifiler: boolean
    hide: boolean
    endorsements?: Array<{ id: string; endorser: string; forAgainst?: string | null }>
    engagements?: Array<{
      participated: boolean
      engagement: { id: string; title: string } | null
    }>
    contributions?: Array<{
      donorName: string
      amount: number
      cashOrInKind?: string | null
    }>
  }
  incumbent: boolean
  party?: string | null
}

interface RaceGridSectionProps {
  race: {
    id: string
    office: {
      title: string
      type: string
      titleWiki?: string | null
    }
    candidates: GridCandidate[]
  }
  year: number
  stories?: StoryWithCitations[]
  questionnaireRespondents?: Set<string>
}

function formatMoney(total: number): string {
  if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`
  if (total >= 10_000) return `$${Math.round(total / 1_000)}k`
  if (total >= 1_000) return `$${(total / 1_000).toFixed(1)}k`
  return `$${Math.round(total)}`
}

function partyBadge(party?: string | null): { label: string; cls: string } | null {
  if (!party) return null
  const normalized = party.toLowerCase()
  if (normalized.startsWith('dem')) return { label: 'D', cls: 'd' }
  if (normalized.startsWith('rep')) return { label: 'R', cls: 'r' }
  if (normalized.startsWith('ind')) return { label: 'I', cls: 'x' }
  return { label: party.charAt(0).toUpperCase(), cls: 'x' }
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
}

interface CandidateMetrics {
  entry: GridCandidate
  displayName: string
  raised: number
  fundraising: ReturnType<typeof calculateFundraising>
  endorsedFor: Array<{ id: string; endorser: string }>
  endorsedAgainst: Array<{ id: string; endorser: string }>
  participation: Map<string, boolean>
  answered: boolean
  engaged: number
}

function CandidateFace({ candidate }: { candidate: GridCandidate['candidate'] }) {
  const displayName = preferWikiString(candidate as any, 'name') ?? candidate.name
  const displayImage = preferWikiString(candidate as any, 'image') ?? candidate.image
  const isRemoteImage = displayImage ? /^https?:/i.test(displayImage) : false

  return (
    <span className="rg-face">
      {displayImage ? (
        <Image
          src={displayImage}
          alt={displayName}
          width={24}
          height={24}
          sizes="24px"
          unoptimized={isRemoteImage}
        />
      ) : (
        <span className="rg-initials">{initials(displayName)}</span>
      )}
    </span>
  )
}

export function RaceGridSection({
  race,
  year,
  stories = [],
  questionnaireRespondents,
}: RaceGridSectionProps) {
  const raceSlug = slugify(race.office.title)
  const displayTitle = preferWikiString(race.office as any, 'title') ?? race.office.title
  const candidates = race.candidates.filter(({ candidate }) => !candidate.hide)

  if (candidates.length === 0) return null

  const isMega = candidates.length >= 6

  // Race-level engagement opportunities: every forum/event any candidate has a
  // record for, plus the questionnaire when anyone in the race answered one.
  const opportunities = new Map<string, string>()
  for (const { candidate } of candidates) {
    for (const entry of candidate.engagements ?? []) {
      if (entry.engagement) opportunities.set(entry.engagement.id, entry.engagement.title)
    }
  }
  const respondentIds = new Set(
    candidates
      .filter(({ candidate }) => questionnaireRespondents?.has(candidate.id))
      .map(({ candidate }) => candidate.id)
  )
  const hasQuestionnaire = respondentIds.size > 0

  // Surveys are often stored both as a Questionnaire and as an Engagement
  // record (e.g. the CCL Climate Survey). If some engagement's participant set
  // is exactly the respondent set, it IS the questionnaire — don't count it
  // twice as a separate opportunity.
  const questionnaireIsDuplicate =
    hasQuestionnaire &&
    Array.from(opportunities.keys()).some(id => {
      const participants = candidates
        .filter(({ candidate }) =>
          candidate.engagements?.some(e => e.engagement?.id === id && e.participated)
        )
        .map(({ candidate }) => candidate.id)
      return (
        participants.length === respondentIds.size &&
        participants.every(p => respondentIds.has(p))
      )
    })
  const includeQuestionnaireOp = hasQuestionnaire && !questionnaireIsDuplicate
  const opportunityTotal = opportunities.size + (includeQuestionnaireOp ? 1 : 0)

  const metrics: CandidateMetrics[] = candidates.map(entry => {
    const { candidate } = entry
    const fundraising = calculateFundraising(candidate.contributions || [])
    const participation = new Map<string, boolean>()
    for (const record of candidate.engagements ?? []) {
      if (record.engagement) participation.set(record.engagement.id, record.participated)
    }
    const answered = questionnaireRespondents?.has(candidate.id) ?? false
    const engagedForums = Array.from(opportunities.keys()).filter(
      id => participation.get(id) === true
    ).length
    const endorsements = candidate.endorsements ?? []

    return {
      entry,
      displayName: preferWikiString(candidate as any, 'name') ?? candidate.name,
      raised: fundraising?.total ?? 0,
      fundraising,
      endorsedFor: endorsements.filter(e => e.forAgainst !== 'AGAINST'),
      endorsedAgainst: endorsements.filter(e => e.forAgainst === 'AGAINST'),
      participation,
      answered,
      engaged: engagedForums + (includeQuestionnaireOp && answered ? 1 : 0),
    }
  })

  // A metric column appears only when someone in the race has data for it;
  // races with no data anywhere collapse to plain name rows.
  const showEngagementCol = opportunityTotal > 0
  const showMoneyCol = metrics.some(m => m.raised > 0 || m.entry.candidate.minifiler)
  const showEndorseCol = metrics.some(m => m.endorsedFor.length + m.endorsedAgainst.length > 0)
  const hasAnyMetric = showEngagementCol || showMoneyCol || showEndorseCol

  const candidateUrl = (candidate: GridCandidate['candidate']) =>
    `/${year}/candidate/${slugify(candidate.name)}`

  const emptyCell = <span className="rg-empty">—</span>

  const engagementDetail = (m: CandidateMetrics) => (
    <span className="rg-pop-list">
      {includeQuestionnaireOp && (
        <span className={m.answered ? 'is-yes' : 'is-no'}>
          {m.answered ? '✓' : '✗'} Questionnaire
        </span>
      )}
      {Array.from(opportunities.entries()).map(([id, title]) => (
        <span key={id} className={m.participation.get(id) ? 'is-yes' : 'is-no'}>
          {m.participation.get(id) ? '✓' : '✗'} {title}
        </span>
      ))}
    </span>
  )

  const moneyDetail = (m: CandidateMetrics) => (
    <span className="rg-pop-list">
      {m.entry.candidate.minifiler && <span>Mini filer — not required to itemize</span>}
      {m.fundraising && (
        <>
          <span>
            <strong>{formatMoney(m.fundraising.total)}</strong> from {m.fundraising.donors} donors
          </span>
          {m.fundraising.topDonors.slice(0, 3).map(donor => (
            <span key={donor.name}>
              {donor.name} · {formatMoney(donor.amount)}
            </span>
          ))}
        </>
      )}
    </span>
  )

  const endorseForDetail = (m: CandidateMetrics) => (
    <span className="rg-pop-list">
      {m.endorsedFor.map(e => (
        <span key={e.id} className="is-yes">✓ {e.endorser}</span>
      ))}
    </span>
  )

  const endorseAgainstDetail = (m: CandidateMetrics) => (
    <span className="rg-pop-list">
      {m.endorsedAgainst.map(e => (
        <span key={e.id} className="is-no">✗ {e.endorser}</span>
      ))}
    </span>
  )

  const legendParts = [
    showEndorseCol && 'endorsements/letters',
    showMoneyCol && 'fundraising',
    showEngagementCol && 'engagement',
  ].filter(Boolean)
  const metricColCount =
    (showEndorseCol ? 2 : 0) + (showMoneyCol ? 1 : 0) + (showEngagementCol ? 1 : 0)

  return (
    <section className={`rg-section${isMega ? ' is-mega' : ''}`}>
      <header className="rg-head">
        <h3>
          <Link href={`/${year}/compare/${raceSlug}`}>{displayTitle}</Link>
        </h3>
        <span className="rg-head-meta">
          <Link href={`/${year}/compare/${raceSlug}`}>compare »</Link>
        </span>
      </header>

      <table className="rg-table">
        {hasAnyMetric && (
          <thead>
            <tr className="rg-legend-row">
              <th colSpan={1 + metricColCount}>{legendParts.join(', ')}</th>
            </tr>
            <tr>
              <th className="rg-col-name" />
              {showEndorseCol && <th className="rg-col-num">👍</th>}
              {showEndorseCol && <th className="rg-col-num">👎</th>}
              {showMoneyCol && <th className="rg-col-num">💰</th>}
              {showEngagementCol && <th className="rg-col-num">🎙️</th>}
            </tr>
          </thead>
        )}
        <tbody>
          {metrics.map(m => {
            const { candidate, party, incumbent } = m.entry
            const badge = partyBadge(party)

            return (
              <tr key={candidate.id}>
                <td className="rg-col-name">
                  <Link href={candidateUrl(candidate)} className="rg-table-candidate">
                    <CandidateFace candidate={candidate} />
                    <span>{m.displayName}</span>
                  </Link>
                  {badge && <span className={`rg-party rg-party-${badge.cls}`}>{badge.label}</span>}
                  {incumbent && <span className="rg-incumbent">inc.</span>}
                </td>
                {showEndorseCol && (
                  <td className="rg-col-num">
                    {m.endorsedFor.length > 0 ? (
                      <MetricPopover value={String(m.endorsedFor.length)}>
                        {endorseForDetail(m)}
                      </MetricPopover>
                    ) : (
                      <span className="rg-empty">0</span>
                    )}
                  </td>
                )}
                {showEndorseCol && (
                  <td className="rg-col-num">
                    {m.endorsedAgainst.length > 0 ? (
                      <MetricPopover value={String(m.endorsedAgainst.length)}>
                        {endorseAgainstDetail(m)}
                      </MetricPopover>
                    ) : (
                      <span className="rg-empty">0</span>
                    )}
                  </td>
                )}
                {showMoneyCol && (
                  <td className="rg-col-num">
                    {m.raised > 0 || m.entry.candidate.minifiler ? (
                      <MetricPopover value={m.raised > 0 ? formatMoney(m.raised) : 'mini'}>
                        {moneyDetail(m)}
                      </MetricPopover>
                    ) : (
                      emptyCell
                    )}
                  </td>
                )}
                {showEngagementCol && (
                  <td className="rg-col-num">
                    <MetricPopover value={`${m.engaged}/${opportunityTotal}`}>
                      {engagementDetail(m)}
                    </MetricPopover>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      {stories.map(story => (
        <details key={story.id} className="rg-story">
          <summary>
            <span className="rg-story-mark">⚡</span> {story.headline}
          </summary>
          <div className="rg-story-body">
            {story.blurb && <p>{story.blurb}</p>}
            {story.citations.length > 0 && (
              <p className="rg-story-cites">
                {story.citations.map(citation => (
                  <a key={citation.id} href={citation.url} target="_blank" rel="noopener noreferrer">
                    [{citation.position}] {citation.outlet}
                  </a>
                ))}
              </p>
            )}
          </div>
        </details>
      ))}
    </section>
  )
}

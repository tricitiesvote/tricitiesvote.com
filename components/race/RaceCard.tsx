import Link from 'next/link'
import { CandidateMini } from '../candidate/CandidateMini'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { slugify } from '@/lib/utils'
import { preferWikiString } from '@/lib/wiki/utils'
import { ensureHtml } from '@/lib/richText'

interface RaceCardProps {
  race: {
    id: string
    office: {
      title: string
      type: string
      titleWiki?: string | null
    }
    intro?: string | null
    body?: string | null
    candidates: Array<{
      candidate: {
        id: string
        name: string
        image?: string | null
        nameWiki?: string | null
        imageWiki?: string | null
        email?: string | null
        website?: string | null
        facebook?: string | null
        twitter?: string | null
        instagram?: string | null
        youtube?: string | null
        pdc?: string | null
        minifiler: boolean
        hide: boolean
        statement?: string | null
        bio?: string | null
        engagement?: string | null
        engagementWiki?: string | null
        electionYear: number
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
        donors?: string | null
        contributions?: Array<{
          donorName: string
          amount: number
          cashOrInKind?: string | null
        }>
      }
      incumbent: boolean
      party?: string | null
      elected?: boolean | null
      voteCount?: number | null
      votePercent?: number | null
    }>
  }
  year: number
}

export function RaceCard({ race, year }: RaceCardProps) {
  const raceSlug = slugify(race.office.title)
  const displayTitle = preferWikiString(race.office as any, 'title') ?? race.office.title
  const visibleCandidates = race.candidates.filter(({ candidate }) => !candidate.hide)
  const isBallotMeasure = race.office.type === 'BALLOT_MEASURE'
  const introSource = preferWikiString(race as any, 'intro') ?? race.intro ?? null
  const introHtml = introSource ? ensureHtml(introSource) : null

  let summary: string | null = null
  if (isBallotMeasure && introHtml) {
    const text = introHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    summary = text.length > 300 ? `${text.slice(0, 297)}…` : text
  }

  if (isBallotMeasure) {
    return (
      <div className="race">
        <h2>
          <Link href={`/${year}/compare/${raceSlug}`}>
            {displayTitle}
          </Link>
        </h2>
        {summary && (
          <div className="ballot-measure-summary-card">
            <p>{summary}</p>
            <Link className="ballot-measure-link" href={`/${year}/compare/${raceSlug}`}>
              View measure details »
            </Link>
          </div>
        )}
        <div className="container-candidate container-candidate-mini">
          {visibleCandidates.length === 0 ? (
            <p className="candidate-empty">Positions coming soon.</p>
          ) : (
            visibleCandidates.map(({ candidate }) => {
              const fundraising = calculateFundraising(candidate.contributions || [])
              return (
                <CandidateMini
                  key={candidate.id}
                  candidate={candidate}
                  fundraising={fundraising}
                  year={year}
                  officeType={race.office.type}
                />
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="race">
      <h2>
        <Link href={`/${year}/compare/${raceSlug}`}>
          {displayTitle}
        </Link>
      </h2>

      <div className="compare-link">
        <Link href={`/${year}/compare/${raceSlug}`}>
          🟢 🟡 Compare Candidates »
        </Link>
      </div>

      <div className="container-candidate container-candidate-mini">
        {visibleCandidates.length === 0 ? (
          <p className="candidate-empty">Candidate details N/A.</p>
        ) : (
          visibleCandidates.map(({ candidate }) => {
            const fundraising = calculateFundraising(candidate.contributions || [])

            return (
              <CandidateMini
                key={candidate.id}
                candidate={candidate}
                fundraising={fundraising}
                year={year}
                officeType={race.office.type}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

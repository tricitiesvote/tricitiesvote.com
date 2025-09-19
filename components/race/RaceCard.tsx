import Link from 'next/link'
import { CandidateMini } from '../candidate/CandidateMini'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { slugify } from '@/lib/utils'

interface RaceCardProps {
  race: {
    id: string
    office: {
      title: string
      type: string
    }
    candidates: Array<{
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
        hide: boolean
        statement?: string | null
        bio?: string | null
        engagement?: string | null
        electionYear: number
        endorsements?: Array<{
          id: string
          endorser: string
          url: string
          type: string
          forAgainst: string
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
  // Create a slug from office title
  const raceSlug = slugify(race.office.title)
  const visibleCandidates = race.candidates.filter(({ candidate }) => !candidate.hide)
  
  return (
    <div className="race">
      <h2>
        <Link href={`/${year}/race/${raceSlug}`}>
          {race.office.title} »
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
            // Calculate fundraising from contributions
            const fundraising = calculateFundraising(candidate.contributions || [])

            return (
              <CandidateMini
                key={candidate.id}
                candidate={candidate}
                fundraising={fundraising}
                year={year}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

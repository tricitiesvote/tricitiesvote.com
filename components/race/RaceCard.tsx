import Link from 'next/link'
import { CandidateMini } from '../candidate/CandidateMini'

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
  const raceSlug = race.office.title.toLowerCase().replace(/\s+/g, '-')
  
  return (
    <div className="race">
      <h2>
        <Link href={`/${year}/race/${raceSlug}`}>
          {race.office.title} »
        </Link>
      </h2>
      
      <div className="compare-link">
        <span className="compare-icon">🟡</span>
        <span className="compare-icon">🟢</span>
        <Link href={`/${year}/compare/${raceSlug}`}>
          Compare candidates »
        </Link>
      </div>
      
      <div className="container-candidate">
        {race.candidates
          .filter(({ candidate }) => !candidate.hide)
          .map(({ candidate }) => {
            // Calculate fundraising data from PDC if available
            const fundraising = candidate.pdc ? {
              total: 0, // This would come from PDC data
              donors: 0,
              topDonors: []
            } : null

            return (
              <CandidateMini
                key={candidate.id}
                candidate={candidate}
                fundraising={fundraising}
                year={year}
              />
            )
          })}
      </div>
    </div>
  )
}
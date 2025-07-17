import Link from 'next/link'
import { slugify } from '@/lib/utils'

interface RaceCardProps {
  race: {
    id: string
    slug: string
    title: string
    office: {
      title: string
    }
    candidates: {
      candidate: {
        id: string
        name: string
        slug: string
      }
    }[]
  }
  year: number
}

export function RaceCard({ race, year }: RaceCardProps) {
  return (
    <div className="race-card">
      <header className="race-header">
        <h3>
          <Link href={`/${year}/race/${race.slug}`}>
            {race.title}
          </Link>
        </h3>
        <p className="office-name">{race.office.title}</p>
      </header>
      
      <div className="candidates-list">
        {race.candidates.map(candidateRelation => (
          <div key={candidateRelation.candidate.id} className="candidate-item">
            <Link href={`/${year}/candidate/${candidateRelation.candidate.slug}`}>
              {candidateRelation.candidate.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
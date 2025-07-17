import Link from 'next/link'
import { CandidateCard } from '@/components/candidate/CandidateCard'

interface RaceOverviewProps {
  race: {
    id: string
    title: string
    slug: string
    office: {
      title: string
    }
    guide: {
      title: string
      region: {
        name: string
      }
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

export function RaceOverview({ race, year }: RaceOverviewProps) {
  const regionSlug = race.guide.region.name.toLowerCase().replace(/\s+/g, '-')
  
  return (
    <div className="race-overview">
      <header className="race-header">
        <nav className="breadcrumb">
          <Link href={`/${year}`}>{year}</Link>
          <span> / </span>
          <Link href={`/${year}/guide/${regionSlug}`}>{race.guide.title}</Link>
        </nav>
        
        <h1>{race.title}</h1>
        <p className="office-name">{race.office.title}</p>
      </header>
      
      <main>
        <div className="candidates-grid">
          {race.candidates.map(candidateRelation => (
            <CandidateCard 
              key={candidateRelation.candidate.id} 
              candidate={candidateRelation.candidate} 
              year={year}
              showRace={false}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
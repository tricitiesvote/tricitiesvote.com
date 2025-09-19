import Link from 'next/link'
import { CandidateCard } from '@/components/candidate/CandidateCard'
import { slugify } from '@/lib/utils'

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
  const regionSlug = slugify(race.guide.region.name)
  const breadcrumbs = [
    { label: String(year), href: `/${year}` },
    { label: race.guide.region.name, href: `/${year}/guide/${regionSlug}` }
  ]
  
  return (
    <div className="race-overview">
      <header className="race-header">
        <nav className="breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`}>
              {index > 0 && ' » '}
              <Link href={crumb.href}>{crumb.label}</Link>
            </span>
          ))}
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

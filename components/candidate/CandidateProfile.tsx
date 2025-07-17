import Link from 'next/link'

interface CandidateProfileProps {
  candidate: {
    id: string
    name: string
    slug: string
    office: {
      title: string
      jobTitle: string
    }
    races: {
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
      }
    }[]
  }
  year: number
}

export function CandidateProfile({ candidate, year }: CandidateProfileProps) {
  const race = candidate.races[0]?.race // Assuming one race per candidate per year
  const regionSlug = race?.guide.region.name.toLowerCase().replace(/\s+/g, '-')
  
  return (
    <div className="candidate-profile">
      <header className="candidate-header">
        <nav className="breadcrumb">
          <Link href={`/${year}`}>{year}</Link>
          {race && (
            <>
              <span> / </span>
              <Link href={`/${year}/guide/${regionSlug}`}>{race.guide.title}</Link>
              <span> / </span>
              <Link href={`/${year}/race/${race.slug}`}>{race.title}</Link>
            </>
          )}
        </nav>
        
        <h1>{candidate.name}</h1>
        <p className="office-name">Candidate for {candidate.office.jobTitle}</p>
      </header>
      
      <main className="candidate-content">
        <div className="candidate-info">
          <p>Candidate information and responses will be displayed here.</p>
        </div>
      </main>
    </div>
  )
}
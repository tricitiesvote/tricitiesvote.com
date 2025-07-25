import { getRaceByYearAndSlug } from '@/lib/queries'
import { Candidate } from '@/components/candidate/Candidate'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { calculateFundraising } from '@/lib/calculateFundraising'

interface RacePageProps {
  params: { 
    year: string
    slug: string 
  }
}

export default async function RacePage({ params }: RacePageProps) {
  const year = parseInt(params.year)
  const race = await getRaceByYearAndSlug(year, params.slug)
  
  if (!race) {
    notFound()
  }
  
  return (
    <>
      <nav>
        <Link href={`/${year}`}>{year} Election</Link> &gt;{' '}
        {race.Guide && race.Guide.length > 0 && (
          <>
            <Link href={`/${year}/guide/${race.Guide[0].region.name.toLowerCase().replace(/\s+/g, '-')}`}>
              {race.Guide[0].region.name} Guide
            </Link> &gt;{' '}
          </>
        )}
        {race.office.title}
      </nav>
      
      <div className="guide">
        <section className="race">
          <a href={`/${year}/race/${params.slug}`}>
            <h2>{race.office.title}</h2>
          </a>
          
          {race.intro && (
            <div className="race-intro" dangerouslySetInnerHTML={{ __html: race.intro }} />
          )}
          
          <div className="container-candidate">
            {race.candidates
              .filter(({ candidate }) => !candidate.hide)
              .map(({ candidate }) => {
                // Calculate fundraising from contributions
                const fundraising = calculateFundraising(candidate.contributions || [])

                return (
                  <Candidate
                    key={candidate.id}
                    candidate={candidate}
                    fundraising={fundraising}
                    year={year}
                    fullsize={false}
                  />
                )
              })}
          </div>
          
          {race.body && (
            <div className="race-body" dangerouslySetInnerHTML={{ __html: race.body }} />
          )}
        </section>
      </div>
    </>
  )
}
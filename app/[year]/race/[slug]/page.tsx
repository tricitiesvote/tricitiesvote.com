import { cache } from 'react'
import { getAvailableYears, getGuidesForYear, getRaceByYearAndSlug } from '@/lib/queries'
import { Candidate } from '@/components/candidate/Candidate'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { slugify } from '@/lib/utils'
import { buildBreadcrumbs } from '@/lib/officeDisplay'

interface RacePageProps {
  params: { 
    year: string
    slug: string 
  }
}

const getRaceCached = cache(async (year: number, slug: string) => getRaceByYearAndSlug(year, slug))

export const revalidate = 3600

export async function generateStaticParams() {
  const years = await getAvailableYears()
  if (years.length === 0) {
    return []
  }

  const latestYear = years[0]
  const guides = await getGuidesForYear(latestYear)
  const seen = new Set<string>()
  const params: Array<{ year: string; slug: string }> = []

  for (const guide of guides) {
    for (const race of guide.Race) {
      const raceSlug = slugify(race.office.title)
      if (!seen.has(raceSlug)) {
        seen.add(raceSlug)
        params.push({ year: String(latestYear), slug: raceSlug })
      }
    }
  }

  return params
}

export default async function RacePage({ params }: RacePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    notFound()
  }

  const race = await getRaceCached(year, params.slug)
  
  if (!race) {
    notFound()
  }
  
  const guide = race.Guide?.[0]
  const breadcrumbs = buildBreadcrumbs({
    year,
    region: guide?.region,
    office: race.office
  })

  return (
    <>
      <nav className="breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`}>
            {index > 0 && ' » '}
            {crumb.url ? <Link href={crumb.url}>{crumb.label}</Link> : crumb.label}
          </span>
        ))}
      </nav>

      <div className="guide">
        <section className="race">
          <h1 className="race-title">{race.office.title}</h1>

          {race.intro && (
            <div className="race-intro" dangerouslySetInnerHTML={{ __html: race.intro }} />
          )}

          <div className="compare-candidate-list">
            {race.candidates.filter(({ candidate }) => !candidate.hide).length === 0 ? (
              <p className="candidate-empty">Candidate details N/A.</p>
            ) : (
              race.candidates
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
                })
            )}
          </div>

          {race.body && (
            <div className="race-body" dangerouslySetInnerHTML={{ __html: race.body }} />
          )}
        </section>
      </div>
    </>
  )
}

import { getGuidesForYear } from '@/lib/queries'
import { getYearType, slugify } from '@/lib/utils'
import { createOgMetadata } from '@/lib/meta/og'
import { getVisibleRaces } from '@/lib/raceVisibility'
import { GuideSelector } from '@/components/GuideSelector'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface YearHomePageProps {
  params: { year: string }
}

export async function generateMetadata({ params }: YearHomePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    return createOgMetadata({
      title: 'Tri-Cities Vote',
      canonicalPath: '/',
      description: 'Nonpartisan voter guides for Tri-Cities elections'
    })
  }

  const yearType = getYearType(year)
  const label = yearType === 'municipal' ? 'Municipal' : 'General'

  return createOgMetadata({
    title: `${year} ${label} Election Guide`,
    description: `Explore Tri-Cities races, candidate statements, questionnaires, endorsements, and events for the ${year} ${label.toLowerCase()} election.`,
    canonicalPath: `/${year}`,
    imagePath: `og/${year}/year.png`
  })
}

export default async function YearHomePage({ params }: YearHomePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    notFound()
  }
  const guides = await getGuidesForYear(year)
  const yearType = getYearType(year)
  
  return (
    <div className="year-homepage">
      <header className="page-header">
        <h1>{year} {yearType === 'municipal' ? 'Municipal' : 'General'} Election Guide</h1>
      </header>
      
      <GuideSelector year={year} />
      
      <main>
        <div className="guides-overview">
          {guides.length === 0 ? (
            <p className="guide-empty">Guides N/A for this year.</p>
          ) : (
            guides.map(guide => {
              const regionSlug = slugify(guide.region.name)
              const visibleRaces = getVisibleRaces(guide.Race)
              return (
                <div key={guide.id} className="guide-preview">
                  <h3>{guide.region.name} Guide</h3>
                  <p>{visibleRaces.length} {visibleRaces.length === 1 ? 'race' : 'races'}</p>
                  <Link href={`/${year}/guide/${regionSlug}`}>
                    View Guide →
                  </Link>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}

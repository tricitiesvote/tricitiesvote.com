import { cache } from 'react'
import { getAvailableYears, getGuideByYearAndRegion, getGuidesForYear } from '@/lib/queries'
import { RaceCard } from '@/components/race/RaceCard'
import { notFound } from 'next/navigation'
import { orderRaces } from '@/lib/raceOrdering'
import { slugify } from '@/lib/utils'
import { getVisibleRaces } from '@/lib/raceVisibility'
import { createOgMetadata } from '@/lib/meta/og'

const getGuideCached = cache(async (year: number, regionSlug: string) =>
  getGuideByYearAndRegion(year, regionSlug)
)

export const revalidate = 3600

export async function generateMetadata({ params }: RegionalGuidePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    return createOgMetadata({
      title: 'Tri-Cities Vote',
      canonicalPath: '/',
      description: 'Nonpartisan voter guides for Tri-Cities elections'
    })
  }

  const guide = await getGuideCached(year, params.region)

  if (!guide) {
    notFound()
  }

  return createOgMetadata({
    title: `${guide.region.name} Guide • ${year} Election`,
    description: `See candidate statements, questionnaires, and events for ${guide.region.name} races in ${year}.`,
    canonicalPath: `/${year}/guide/${params.region}`,
    imagePath: `og/${year}/guide/${params.region}.png`
  })
}

export async function generateStaticParams() {
  const years = await getAvailableYears()
  if (years.length === 0) {
    return []
  }

  const latestYear = years[0]
  const guides = await getGuidesForYear(latestYear)

  return guides.map(guide => ({
    year: String(latestYear),
    region: slugify(guide.region.name)
  }))
}

interface RegionalGuidePageProps {
  params: { 
    year: string
    region: string 
  }
}

export default async function RegionalGuidePage({ params }: RegionalGuidePageProps) {
  const year = Number.parseInt(params.year, 10)
  const regionSlug = params.region
  
  if (!Number.isFinite(year)) {
    notFound()
  }

  const guide = await getGuideCached(year, regionSlug)
  
  if (!guide) {
    notFound()
  }
  
  const orderedRaces = orderRaces(guide.Race, year)
  const visibleRaces = getVisibleRaces(orderedRaces)

  return (
    <div className="regional-guide">
      <h1>{year} {guide.region.name} Election Guide</h1>
      
      <main>
        <div className="races-collection guide-page">
          {visibleRaces.length === 0 ? (
            <p className="race-empty">Race list N/A. Check back soon.</p>
          ) : (
            visibleRaces.map(race => (
              <RaceCard key={race.id} race={race} year={year} />
            ))
          )}
        </div>
      </main>
    </div>
  )
}

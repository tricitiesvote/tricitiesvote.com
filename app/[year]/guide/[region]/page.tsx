import { cache } from 'react'
import { getAvailableYears, getGuideByYearAndRegion, getGuidesForYear } from '@/lib/queries'
import { RaceCard } from '@/components/race/RaceCard'
import { notFound } from 'next/navigation'
import { orderRaces } from '@/lib/raceOrdering'
import { slugify } from '@/lib/utils'
import { getVisibleRaces } from '@/lib/raceVisibility'

const getGuideCached = cache(async (year: number, regionSlug: string) =>
  getGuideByYearAndRegion(year, regionSlug)
)

export const revalidate = 3600

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

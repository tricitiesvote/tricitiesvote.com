import { getGuideByYearAndRegion } from '@/lib/queries'
import { GuideSelector } from '@/components/GuideSelector'
import { RaceCard } from '@/components/race/RaceCard'
import { notFound } from 'next/navigation'
import { orderRaces } from '@/lib/raceOrdering'

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

  const guide = await getGuideByYearAndRegion(year, regionSlug)
  
  if (!guide) {
    notFound()
  }
  
  return (
    <div className="regional-guide">
      <h1>{year} {guide.region.name} Election Guide</h1>
      
      <main>
        <div className="races-collection guide-page">
          {guide.Race.length === 0 ? (
            <p className="race-empty">Race list N/A. Check back soon.</p>
          ) : (
            orderRaces(guide.Race, year).map(race => (
              <RaceCard key={race.id} race={race} year={year} />
            ))
          )}
        </div>
      </main>
    </div>
  )
}

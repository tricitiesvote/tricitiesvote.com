import { getGuideByYearAndRegion } from '@/lib/queries'
import { GuideSelector } from '@/components/GuideSelector'
import { RaceCard } from '@/components/race/RaceCard'
import { notFound } from 'next/navigation'

interface RegionalGuidePageProps {
  params: { 
    year: string
    region: string 
  }
}

export default async function RegionalGuidePage({ params }: RegionalGuidePageProps) {
  const year = parseInt(params.year)
  const regionSlug = params.region
  
  const guide = await getGuideByYearAndRegion(year, regionSlug)
  
  if (!guide) {
    notFound()
  }
  
  return (
    <div className="regional-guide">
      <header className="page-header">
        <h1>{guide.title}</h1>
        <GuideSelector year={year} currentRegion={regionSlug} />
      </header>
      
      <main>
        <div className="races-list">
          {guide.races.map(race => (
            <RaceCard key={race.id} race={race} year={year} />
          ))}
        </div>
      </main>
    </div>
  )
}
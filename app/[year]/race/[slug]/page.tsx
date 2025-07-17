import { getRaceByYearAndSlug } from '@/lib/queries'
import { RaceOverview } from '@/components/race/RaceOverview'
import { notFound } from 'next/navigation'

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
    <div className="race-page">
      <RaceOverview race={race} year={year} />
    </div>
  )
}
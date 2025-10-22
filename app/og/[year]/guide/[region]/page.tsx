import { OgHeader } from '@/components/og/OgHeader'
import { getGuidesForYear, getGuideByYearAndRegion } from '@/lib/queries'
import { slugify } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'

interface OgGuidePageProps {
  params: { year: string; region: string }
}

export const revalidate = 3600

export async function generateStaticParams() {
  const year = CURRENT_ELECTION_YEAR
  const guides = await getGuidesForYear(year)

  return guides.map(guide => ({
    year: String(year),
    region: slugify(guide.region.name)
  }))
}

export default async function OgGuidePage({ params }: OgGuidePageProps) {
  const year = Number.parseInt(params.year, 10)
  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    notFound()
  }

  const guide = await getGuideByYearAndRegion(year, params.region)
  if (!guide) {
    notFound()
  }

  const topRaces = guide.Race.slice(0, 6)

  return (
    <>
      <OgHeader title={`${guide.region.name} Election Guide`} subtitle={`${year} General Election`} />
      <div className="og-guide-deck">
        A non-partisan collection of <br/>
        information to help you decide.
      </div>
    </>
  )
}

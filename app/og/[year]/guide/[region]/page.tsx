import { OgHeader } from '@/components/og/OgHeader'
import { getAvailableYears, getGuidesForYear, getGuideByYearAndRegion } from '@/lib/queries'
import { slugify } from '@/lib/utils'
import { notFound } from 'next/navigation'

interface OgGuidePageProps {
  params: { year: string; region: string }
}

export const revalidate = 3600

export async function generateStaticParams() {
  const years = await getAvailableYears()
  const params: Array<{ year: string; region: string }> = []

  for (const year of years) {
    const guides = await getGuidesForYear(year)
    for (const guide of guides) {
      params.push({ year: String(year), region: slugify(guide.region.name) })
    }
  }

  return params
}

export default async function OgGuidePage({ params }: OgGuidePageProps) {
  const year = Number.parseInt(params.year, 10)
  if (!Number.isFinite(year)) {
    notFound()
  }

  const guide = await getGuideByYearAndRegion(year, params.region)
  if (!guide) {
    notFound()
  }

  const topRaces = guide.Race.slice(0, 6)

  return (
    <>
      <OgHeader title={`${guide.region.name} Guide`} subtitle={`${year} General Election`} />
      <div className="og-guide-deck">
        Candidate statements, questionnaires, endorsements, and events tailored to {guide.region.name} voters.
      </div>
      <div className="og-year-grid">
        {topRaces.map(race => (
          <div key={race.id} className="og-year-grid-item">
            {race.office.title}
          </div>
        ))}
      </div>
    </>
  )
}

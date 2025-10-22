import { OgHeader } from '@/components/og/OgHeader'
import { getGuidesForYear } from '@/lib/queries'
import { getYearType } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'

interface OgYearPageProps {
  params: { year: string }
}

export const revalidate = 3600

export async function generateStaticParams() {
  return [{ year: String(CURRENT_ELECTION_YEAR) }]
}

export default async function OgYearPage({ params }: OgYearPageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    notFound()
  }

  const guides = await getGuidesForYear(year)
  if (!guides) {
    notFound()
  }

  const yearType = getYearType(year)
  const label = yearType === 'municipal' ? 'Municipal' : 'General'

  return (
    <>
      <OgHeader title={`${year} ${label} Election Guide`} />
      <div className="og-year-deck">
        Featuring comprehensive coverage for every contested race across the Tri-Cities.
      </div>
      <div className="og-year-grid">
        {guides.slice(0, 6).map(guide => (
          <div key={guide.id} className="og-year-grid-item">
            {guide.region.name}
            <div className="og-year-grid-label">
              {guide.Race.length} {guide.Race.length === 1 ? 'race' : 'races'} tracked
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

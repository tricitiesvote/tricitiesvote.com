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
      <OgHeader title={`${year} Election Guide`} />
      <div className="og-year-deck">
        A non-partisan collection of <br/>
        information to help you decide.
      </div>
    </>
  )
}

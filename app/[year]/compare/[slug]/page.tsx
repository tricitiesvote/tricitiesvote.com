import { getRaceByYearAndSlug } from '@/lib/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { slugify } from '@/lib/utils'
import { Candidate } from '@/components/candidate/Candidate'
import { CompareTable, type ComparisonRow } from '@/components/compare/CompareTable'
import { getOfficeBreadcrumbParts } from '@/lib/officeDisplay'

interface ComparePageProps {
  params: {
    year: string
    slug: string
  }
}

export default async function ComparePage({ params }: ComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    notFound()
  }

  const race = await getRaceByYearAndSlug(year, params.slug)

  if (!race) {
    notFound()
  }

  const guide = race.Guide?.[0]
  const regionName = guide?.region.name
  const regionSlug = regionName ? slugify(regionName) : null
  const visibleCandidates = race.candidates.filter(({ candidate }) => !candidate.hide)
  const compareRows: ComparisonRow[] = Array.isArray((race as any)?.comparisons)
    ? ((race as any).comparisons as ComparisonRow[])
    : []

  const officeParts = getOfficeBreadcrumbParts(race.office)

  const breadcrumbs = [
    { label: String(year), href: `/${year}` },
    regionName && regionSlug
      ? { label: regionName, href: `/${year}/guide/${regionSlug}` }
      : null,
    { label: officeParts.section, href: `/${year}/race/${params.slug}` },
    officeParts.seat ? { label: officeParts.seat } : null,
    { label: 'Compare' }
  ].filter(Boolean) as Array<{ label: string; href?: string }>

  return (
    <>
      <nav className="breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`}>
            {index > 0 && ' » '}
            {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
          </span>
        ))}
      </nav>

      <div className="guide">
        <section className="race race-compare">
          <h1 className="race-title">{race.office.title}</h1>

          <CompareTable rows={compareRows} />

          {visibleCandidates.length === 0 ? (
            <p className="candidate-empty">Candidate details N/A.</p>
          ) : (
            <div className="compare-candidate-list">
              {visibleCandidates.map(({ candidate }) => {
                const fundraising = calculateFundraising(candidate.contributions || [])

                return (
                  <Candidate
                    key={candidate.id}
                    candidate={candidate}
                    year={year}
                    fundraising={fundraising}
                    fullsize={true}
                  />
                )
              })}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

import { cache } from 'react'
import { getAvailableYears, getGuidesForYear, getRaceByYearAndSlug } from '@/lib/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { slugify } from '@/lib/utils'
import { Candidate } from '@/components/candidate/Candidate'
import { CompareTable, type ComparisonRow } from '@/components/compare/CompareTable'
import { CompareQuestionnaires } from '@/components/compare/CompareQuestionnaires'
import { buildBreadcrumbs } from '@/lib/officeDisplay'
import { preferWikiString } from '@/lib/wiki/utils'
import { evaluateTriCitiesRaceStatus } from '@/lib/triCitiesVote'
import { TriCitiesQuestionnaireBanner } from '@/components/race/TriCitiesQuestionnaireBanner'

interface ComparePageProps {
  params: {
    year: string
    slug: string
  }
}

const getRaceCached = cache(async (year: number, slug: string) => getRaceByYearAndSlug(year, slug))

export const revalidate = 3600

export async function generateStaticParams() {
  const years = await getAvailableYears()
  if (years.length === 0) {
    return []
  }

  const latestYear = years[0]
  const guides = await getGuidesForYear(latestYear)
  const seen = new Set<string>()
  const params: Array<{ year: string; slug: string }> = []

  for (const guide of guides) {
    for (const race of guide.Race) {
      const raceSlug = slugify(race.office.title)
      if (!seen.has(raceSlug)) {
        seen.add(raceSlug)
        params.push({ year: String(latestYear), slug: raceSlug })
      }
    }
  }

  return params
}

export default async function ComparePage({ params }: ComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    notFound()
  }

  const race = await getRaceCached(year, params.slug)

  if (!race) {
    notFound()
  }

  const triCitiesStatus = evaluateTriCitiesRaceStatus(race, year)

  const guide = race.Guide?.[0]
  const regionName = guide?.region.name
  const regionSlug = regionName ? slugify(regionName) : null
  const visibleCandidates = race.candidates.filter(({ candidate }) => !candidate.hide)
  const compareCandidates = visibleCandidates.map(({ candidate }) => ({
    id: candidate.id,
    name: preferWikiString(candidate as any, 'name') ?? candidate.name,
    image: candidate.image ?? null
  }))
  const compareRows: ComparisonRow[] = Array.isArray((race as any)?.comparisons)
    ? ((race as any).comparisons as ComparisonRow[])
    : []

  const breadcrumbs = buildBreadcrumbs({
    year,
    region: guide?.region,
    office: race.office,
  })
  breadcrumbs.push({ label: 'Compare', url: `/${year}/compare/${params.slug}` })

  const displayTitle = preferWikiString(race.office as any, 'title') ?? race.office.title

  return (
    <>
      <nav className="breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`}>
            {index > 0 && ' » '}
            {crumb.url ? <Link href={crumb.url}>{crumb.label}</Link> : crumb.label}
          </span>
        ))}
      </nav>

      <TriCitiesQuestionnaireBanner status={triCitiesStatus} />

      <div className="guide">
        <section className="race race-compare">
          <h1 className="race-title">{displayTitle}</h1>

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

          <CompareQuestionnaires
            year={year}
            regionId={race.office.regionId}
            candidates={compareCandidates}
            hiddenTitles={triCitiesStatus.hiddenTitles}
          />
        </section>
      </div>
    </>
  )
}

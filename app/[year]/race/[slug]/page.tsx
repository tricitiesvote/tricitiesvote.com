import { cache } from 'react'
import { getAvailableYears, getGuidesForYear, getRaceByYearAndSlug } from '@/lib/queries'
import { Candidate } from '@/components/candidate/Candidate'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { slugify } from '@/lib/utils'
import { buildBreadcrumbs } from '@/lib/officeDisplay'
import { preferWikiString } from '@/lib/wiki/utils'
import { ensureHtml } from '@/lib/richText'
import { evaluateTriCitiesRaceStatus } from '@/lib/triCitiesVote'
import { TriCitiesQuestionnaireBanner } from '@/components/race/TriCitiesQuestionnaireBanner'
import { BallotMeasureDetails } from '@/components/race/BallotMeasureDetails'
import { createOgMetadata } from '@/lib/meta/og'

interface RacePageProps {
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

export async function generateMetadata({ params }: RacePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    return createOgMetadata({
      title: 'Tri-Cities Vote',
      canonicalPath: '/',
      description: 'Nonpartisan voter guides for Tri-Cities elections'
    })
  }

  const race = await getRaceCached(year, params.slug)

  if (!race) {
    notFound()
  }

  const raceWithRelations = race as any
  const displayTitle = preferWikiString(raceWithRelations.office as any, 'title') ?? raceWithRelations.office.title
  const regionLabel = raceWithRelations.Guide?.[0]?.region?.name ?? 'Tri-Cities'
  const introSource = preferWikiString(raceWithRelations as any, 'intro') ?? raceWithRelations.intro ?? null
  const bodySource = preferWikiString(raceWithRelations as any, 'body') ?? raceWithRelations.body ?? null
  const description = introSource
    ? introSource.replace(/\s+/g, ' ').replace(/[#*_`>~]/g, '')
    : `Compare candidates in the ${displayTitle} race for the ${year} ${regionLabel} ballot.`

  return createOgMetadata({
    title: `${displayTitle} • ${year} General Election`,
    description,
    canonicalPath: `/${year}/race/${params.slug}`,
    imagePath: `og/${year}/race/${params.slug}.png`
  })
}

export default async function RacePage({ params }: RacePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    notFound()
  }

  const race = await getRaceCached(year, params.slug)
  
  if (!race) {
    notFound()
  }

  const raceWithRelations = race as any
  const triCitiesStatus = evaluateTriCitiesRaceStatus(raceWithRelations, year)
  
  const guide = raceWithRelations.Guide?.[0]
  const introSource = preferWikiString(raceWithRelations as any, 'intro') ?? raceWithRelations.intro ?? null
  const bodySource = preferWikiString(raceWithRelations as any, 'body') ?? raceWithRelations.body ?? null
  const introHtml = ensureHtml(introSource)
  const bodyHtml = ensureHtml(bodySource)
  const isBallotMeasure = raceWithRelations.office.type === 'BALLOT_MEASURE'
  const displayTitle = preferWikiString(raceWithRelations.office as any, 'title') ?? raceWithRelations.office.title
  const breadcrumbs = buildBreadcrumbs({
    year,
    region: guide?.region,
    office: raceWithRelations.office
  })

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
        <section className="race">
          <h1 className="race-title">{displayTitle}</h1>

          {isBallotMeasure ? (
            <>
              <BallotMeasureDetails intro={introSource} body={bodySource} />
              <div className="compare-candidate-list">
                {raceWithRelations.candidates.filter(({ candidate }: any) => !candidate.hide).length === 0 ? (
                  <p className="candidate-empty">Campaign committees N/A.</p>
                ) : (
                  raceWithRelations.candidates
                    .filter(({ candidate }: any) => !candidate.hide)
                    .map(({ candidate }: any) => {
                      const fundraising = calculateFundraising(candidate.contributions || [])

                      return (
                        <Candidate
                          key={candidate.id}
                          candidate={candidate}
                          fundraising={fundraising}
                          year={year}
                          fullsize={false}
                        />
                      )
                    })
                )}
              </div>
            </>
          ) : (
            <>
              {introHtml && (
                <div className="race-intro" dangerouslySetInnerHTML={{ __html: introHtml }} />
              )}

              <div className="compare-candidate-list">
                {raceWithRelations.candidates.filter(({ candidate }: any) => !candidate.hide).length === 0 ? (
                  <p className="candidate-empty">Candidate details N/A.</p>
                ) : (
                  raceWithRelations.candidates
                    .filter(({ candidate }: any) => !candidate.hide)
                    .map(({ candidate }: any) => {
                      const fundraising = calculateFundraising(candidate.contributions || [])

                      return (
                        <Candidate
                          key={candidate.id}
                          candidate={candidate}
                          fundraising={fundraising}
                          year={year}
                          fullsize={false}
                        />
                      )
                    })
                )}
              </div>

              {bodyHtml && (
                <div className="race-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}

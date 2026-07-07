import { cache } from 'react'
import { getGuidesForYear, getRaceByYearAndSlug } from '@/lib/queries'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import { CompareQuestionnaires } from '@/components/compare/CompareQuestionnaires'
import { CompareSelectionProvider } from '@/components/compare/CompareSelection'
import { buildBreadcrumbs } from '@/lib/officeDisplay'
import { preferWikiString } from '@/lib/wiki/utils'
import { evaluateTriCitiesRaceStatus } from '@/lib/triCitiesVote'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'
import { createOgMetadata } from '@/lib/meta/og'

interface QuestionnairePageProps {
  params: {
    year: string
    slug: string
  }
}

const getRaceCached = cache(async (year: number, slug: string) => getRaceByYearAndSlug(year, slug))

export const revalidate = 3600

export async function generateStaticParams() {
  const year = CURRENT_ELECTION_YEAR
  const guides = await getGuidesForYear(year)
  const seen = new Set<string>()
  const params: Array<{ year: string; slug: string }> = []

  for (const guide of guides) {
    for (const race of guide.Race) {
      const raceSlug = slugify(race.office.title)
      if (!seen.has(raceSlug)) {
        seen.add(raceSlug)
        params.push({ year: String(year), slug: raceSlug })
      }
    }
  }

  return params
}

export async function generateMetadata({ params }: QuestionnairePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
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

  const displayTitle = preferWikiString(race.office as any, 'title') ?? race.office.title

  return createOgMetadata({
    title: `${displayTitle} • ${year} Candidate Surveys`,
    description: `Questionnaire and survey responses from candidates in the ${displayTitle} race.`,
    canonicalPath: `/${year}/questionnaires/${params.slug}`
  })
}

export default async function QuestionnairePage({ params }: QuestionnairePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    redirect('/')
  }

  const race = await getRaceCached(year, params.slug)

  if (!race) {
    notFound()
  }

  const raceWithRelations = race as any
  const triCitiesStatus = evaluateTriCitiesRaceStatus(raceWithRelations, year)
  const guide = raceWithRelations.Guide?.[0]

  const visibleCandidates = (Array.isArray(raceWithRelations.candidates)
    ? (raceWithRelations.candidates as Array<{ candidate: any }>)
    : []
  ).filter(({ candidate }) => !candidate.hide)

  const questionnaireCandidates = visibleCandidates.map(({ candidate }: { candidate: any }) => ({
    id: candidate.id,
    name: preferWikiString(candidate as any, 'name') ?? candidate.name,
    image: preferWikiString(candidate as any, 'image') ?? candidate.image ?? null,
    slug: slugify(candidate.name),
  }))

  const displayTitle = preferWikiString(raceWithRelations.office as any, 'title') ?? raceWithRelations.office.title

  const breadcrumbs = buildBreadcrumbs({
    year,
    region: guide?.region,
    office: raceWithRelations.office,
  })
  breadcrumbs.push({ label: 'Surveys', url: `/${year}/questionnaires/${params.slug}` })

  const usePicker = questionnaireCandidates.length > 2

  const body = (
    <>
      <div className="questionnaire-page-intro">
        <p>
          Some of the surveys below were created and conducted by independent community
          organizations, not by Tri-Cities Vote — each one names the group behind it.
          We publish them as a public service.
        </p>
        <p>
          Does your organization survey candidates?{' '}
          <a href="mailto:guide@tricitiesvote.com">Send it to us</a> and we&apos;ll include it.
        </p>
      </div>

      <CompareQuestionnaires
        year={year}
        regionId={raceWithRelations.office.regionId}
        candidates={questionnaireCandidates}
        hiddenTitles={triCitiesStatus.hiddenTitles}
      />
    </>
  )

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

      <div className="guide">
        <section className="race race-compare questionnaire-page">
          <h1 className="race-title">Candidate Surveys — {displayTitle}</h1>

          {usePicker ? (
            <CompareSelectionProvider
              candidates={questionnaireCandidates.map(candidate => ({
                id: candidate.id,
                name: candidate.name,
                image: candidate.image,
              }))}
            >
              {body}
            </CompareSelectionProvider>
          ) : (
            body
          )}
        </section>
      </div>
    </>
  )
}

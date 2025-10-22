import { cache } from 'react'
import { getGuidesForYear, getRaceByYearAndSlug } from '@/lib/queries'
import { slugify } from '@/lib/utils'
import { createOgMetadata } from '@/lib/meta/og'
import { preferWikiString } from '@/lib/wiki/utils'
import { redirect } from 'next/navigation'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'

interface RaceRedirectPageProps {
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

export async function generateMetadata({ params }: RaceRedirectPageProps) {
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
    return createOgMetadata({
      title: 'Tri-Cities Vote',
      canonicalPath: '/',
      description: 'Nonpartisan voter guides for Tri-Cities elections'
    })
  }

  const displayTitle = preferWikiString(race.office as any, 'title') ?? race.office.title
  const regionLabel = race.Guide?.[0]?.region?.name ?? 'Tri-Cities'
  const introSource = preferWikiString(race as any, 'intro') ?? race.intro ?? null
  const description = introSource
    ? introSource.replace(/\s+/g, ' ').replace(/[#*_`>~]/g, '')
    : `Compare candidates in the ${displayTitle} race for the ${year} ${regionLabel} ballot.`

  return createOgMetadata({
    title: `${displayTitle} • ${year} General Election`,
    description,
    canonicalPath: `/${year}/compare/${params.slug}`,
    imagePath: `og/${year}/compare/${params.slug}.png`
  })
}

export default async function RaceRedirectPage({ params }: RaceRedirectPageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    redirect('/')
  }

  redirect(`/${year}/compare/${params.slug}`)
}

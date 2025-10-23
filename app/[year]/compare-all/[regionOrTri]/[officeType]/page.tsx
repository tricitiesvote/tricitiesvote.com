import { cache } from 'react'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { slugify, unslugify } from '@/lib/utils'
import { CompareQuestionnaires } from '@/components/compare/CompareQuestionnaires'
import Link from 'next/link'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'
import { createOgMetadata } from '@/lib/meta/og'
import type { OfficeType } from '@prisma/client'

interface AggregateComparePageProps {
  params: {
    year: string
    regionOrTri: string
    officeType: 'city-council' | 'school-board'
  }
  searchParams: {
    show?: string
  }
}

interface CandidateWithColor {
  id: string
  name: string
  image: string | null
  slug: string
  colorClass: string
  officeName: string
  regionName: string
}

const getAggregateCandidatesCached = cache(
  async (year: number, regionSlug: string | 'tri', officeType: 'city-council' | 'school-board', showHidden: boolean = false) => {
    const officeTypes: OfficeType[] =
      officeType === 'city-council'
        ? ['CITY_COUNCIL', 'MAYOR']
        : ['SCHOOL_BOARD']

    const where: any = {
      electionYear: year,
      office: {
        type: { in: officeTypes }
      }
    }

    // Only filter by hide if not showing hidden candidates
    if (!showHidden) {
      where.hide = false
    }

    // If not "tri", filter by region
    if (regionSlug !== 'tri') {
      const regionName = unslugify(regionSlug)
      const region = await prisma.region.findFirst({
        where: { name: { equals: regionName, mode: 'insensitive' } }
      })

      if (!region) {
        return null
      }

      where.office = {
        ...where.office,
        regionId: region.id
      }
    }

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        office: {
          include: {
            region: true
          }
        }
      },
      orderBy: [
        { office: { region: { name: 'asc' } } },
        { office: { title: 'asc' } },
        { name: 'asc' }
      ]
    })

    return candidates
  }
)

export const revalidate = 3600

export async function generateStaticParams() {
  const year = CURRENT_ELECTION_YEAR

  // Get all regions with races
  const regions = await prisma.region.findMany({
    where: {
      offices: {
        some: {
          candidates: {
            some: {
              electionYear: year
            }
          }
        }
      }
    }
  })

  const params: Array<{ year: string; regionOrTri: string; officeType: 'city-council' | 'school-board' }> = []

  // Add "tri" routes
  params.push(
    { year: String(year), regionOrTri: 'tri', officeType: 'city-council' },
    { year: String(year), regionOrTri: 'tri', officeType: 'school-board' }
  )

  // Add city-specific routes
  for (const region of regions) {
    const regionSlug = slugify(region.name)
    params.push(
      { year: String(year), regionOrTri: regionSlug, officeType: 'city-council' },
      { year: String(year), regionOrTri: regionSlug, officeType: 'school-board' }
    )
  }

  return params
}

export async function generateMetadata({ params }: AggregateComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    return createOgMetadata({
      title: 'Tri-Cities Vote',
      canonicalPath: '/',
      description: 'Nonpartisan voter guides for Tri-Cities elections'
    })
  }

  const isTri = params.regionOrTri === 'tri'
  const officeLabel = isTri && params.officeType === 'city-council'
    ? 'Council'
    : params.officeType === 'city-council'
      ? 'City Council'
      : 'School Board'

  const regionLabel = isTri
    ? 'Tri-Cities'
    : unslugify(params.regionOrTri)

  const title = `${regionLabel} ${officeLabel} Candidate Comparison • ${year}`

  return createOgMetadata({
    title,
    description: `Compare all ${regionLabel} ${officeLabel} candidates for the ${year} election.`,
    canonicalPath: `/${year}/compare-all/${params.regionOrTri}/${params.officeType}`
  })
}

export default async function AggregateComparePage({ params, searchParams }: AggregateComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    redirect('/')
  }

  // Special case: West Richland school board redirects to Richland
  if (params.regionOrTri === 'west-richland' && params.officeType === 'school-board') {
    redirect(`/${year}/compare-all/richland/school-board`)
  }

  const showHidden = searchParams.show === 'all'
  const candidates = await getAggregateCandidatesCached(year, params.regionOrTri, params.officeType, showHidden)

  if (!candidates) {
    notFound()
  }

  // Group candidates by office and assign colors by race
  const officeColorMap = new Map<string, number>()
  let colorIndex = 1

  const candidatesWithColors: CandidateWithColor[] = candidates.map((candidate) => {
    if (!officeColorMap.has(candidate.officeId)) {
      officeColorMap.set(candidate.officeId, colorIndex)
      colorIndex = (colorIndex % 7) + 1
    }

    return {
      id: candidate.id,
      name: candidate.name,
      image: candidate.image,
      slug: slugify(candidate.name),
      colorClass: `candidate-color-${officeColorMap.get(candidate.officeId)}`,
      officeName: candidate.office.title,
      regionName: candidate.office.region.name
    }
  })

  // Create color map for CompareQuestionnaires
  const colorMap = new Map<string, string>(
    candidatesWithColors.map(c => [c.id, c.colorClass])
  )

  const isTri = params.regionOrTri === 'tri'
  const officeLabel = isTri && params.officeType === 'city-council'
    ? 'Council'
    : params.officeType === 'city-council'
      ? 'City Council'
      : 'School Board'

  const regionLabel = isTri
    ? 'Tri-Cities'
    : unslugify(params.regionOrTri)

  const pageTitle = `${regionLabel} ${officeLabel} Candidate Comparison`

  const breadcrumbs = [
    { label: String(year), url: `/${year}` },
    { label: pageTitle, url: null }
  ]

  const sectionClasses = ['race', 'race-compare', 'compare-all']
  if (isTri) {
    sectionClasses.push('compare-all-tri')
  }

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
        <section className={sectionClasses.join(' ')}>
          <h1 className="race-title">{pageTitle}</h1>

          {candidatesWithColors.length === 0 ? (
            <p className="candidate-empty">No candidates found.</p>
          ) : (
            <CompareQuestionnaires
              year={year}
              regionId={null}
              candidates={candidatesWithColors}
              colorMap={colorMap}
              hideOpenQuestions={true}
            />
          )}
        </section>
      </div>
    </>
  )
}

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
    officeType: string
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
  officeId: string
  colorClass: string
  officeName: string
  regionName: string
}

// null = all office types
const OFFICE_TYPE_MAP: Record<string, OfficeType[] | null> = {
  'all': null,
  'city-council': ['CITY_COUNCIL', 'MAYOR'],
  'school-board': ['SCHOOL_BOARD'],
  'us-house': ['US_HOUSE'],
  'us-senate': ['US_SENATE'],
  'legislature': ['STATE_SENATOR', 'STATE_REPRESENTATIVE'],
  'county': ['COUNTY_COMMISSIONER', 'SHERIFF', 'PROSECUTOR'],
  'judicial': ['SUPERIOR_COURT_JUDGE'],
}

const OFFICE_TYPE_LABELS: Record<string, string> = {
  'all': 'All Candidates',
  'city-council': 'City Council',
  'school-board': 'School Board',
  'us-house': 'U.S. House',
  'us-senate': 'U.S. Senate',
  'legislature': 'Legislature',
  'county': 'County',
  'judicial': 'Judicial',
}

const getAggregateCandidatesCached = cache(
  async (year: number, regionSlug: string | 'tri', officeType: string, showHidden: boolean = false) => {
    const officeTypes = OFFICE_TYPE_MAP[officeType]

    if (officeTypes === undefined) {
      return null
    }

    const where: any = {
      electionYear: year,
    }

    if (officeTypes !== null) {
      where.office = {
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
        ...(where.office ?? {}),
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

  const offices = await prisma.office.findMany({
    where: {
      candidates: {
        some: {
          electionYear: year
        }
      }
    },
    select: { type: true }
  })

  const presentTypes = new Set(offices.map(office => office.type))

  const params: Array<{ year: string; regionOrTri: string; officeType: string }> = []

  for (const [key, types] of Object.entries(OFFICE_TYPE_MAP)) {
    if (key === 'all' || types?.some(type => presentTypes.has(type))) {
      params.push({ year: String(year), regionOrTri: 'tri', officeType: key })
    }
  }

  return params
}

export async function generateMetadata({ params }: AggregateComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR || !(params.officeType in OFFICE_TYPE_MAP)) {
    return createOgMetadata({
      title: 'Tri-Cities Vote',
      canonicalPath: '/',
      description: 'Nonpartisan voter guides for Tri-Cities elections'
    })
  }

  const officeLabel = OFFICE_TYPE_LABELS[params.officeType]

  const regionLabel = params.regionOrTri === 'tri'
    ? 'Tri-Cities'
    : unslugify(params.regionOrTri)

  const title = `${regionLabel} ${officeLabel} Comparison • ${year}`

  return createOgMetadata({
    title,
    description: `Compare ${regionLabel} candidates for the ${year} election.`,
    canonicalPath: `/${year}/compare-all/${params.regionOrTri}/${params.officeType}`
  })
}

export default async function AggregateComparePage({ params, searchParams }: AggregateComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    redirect('/')
  }

  if (!(params.officeType in OFFICE_TYPE_MAP)) {
    notFound()
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
      officeId: candidate.officeId,
      colorClass: `candidate-color-${officeColorMap.get(candidate.officeId)}`,
      officeName: candidate.office.title,
      regionName: candidate.office.region.name
    }
  })

  // Create color map for CompareQuestionnaires
  const colorMap = new Map<string, string>(
    candidatesWithColors.map(c => [c.id, c.colorClass])
  )

  const officeLabel = OFFICE_TYPE_LABELS[params.officeType]

  const regionLabel = params.regionOrTri === 'tri'
    ? 'Tri-Cities'
    : unslugify(params.regionOrTri)

  const pageTitle = params.officeType === 'all'
    ? `${regionLabel} Candidate Comparison`
    : `${regionLabel} ${officeLabel} Candidate Comparison`

  const breadcrumbs = [
    { label: String(year), url: `/${year}` },
    { label: pageTitle, url: null }
  ]

  const sectionClasses = ['race', 'race-compare', 'compare-all']
  if (params.regionOrTri === 'tri') {
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
              collapsed={params.officeType === 'all'}
            />
          )}
        </section>
      </div>
    </>
  )
}

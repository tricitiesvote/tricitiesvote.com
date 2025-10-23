import { OgHeader } from '@/components/og/OgHeader'
import { OgCompetitorCard } from '@/components/og/OgCompetitorCard'
import { getGuidesForYear, getRaceByYearAndSlug } from '@/lib/queries'
import { preferWikiString } from '@/lib/wiki/utils'
import { slugify } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'

interface OgComparePageProps {
  params: { year: string; slug: string }
}

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

export default async function OgComparePage({ params }: OgComparePageProps) {
  const year = Number.parseInt(params.year, 10)
  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    notFound()
  }

  const race = await getRaceByYearAndSlug(year, params.slug)
  if (!race) {
    notFound()
  }

  const displayTitle = preferWikiString(race.office as any, 'title') ?? race.office.title
  const regionLabel = race.Guide?.[0]?.region?.name ?? 'Tri-Cities'
  const subtitle = `${regionLabel} • ${year} General Election`

  const isBallotMeasure = race.office.type === 'BALLOT_MEASURE'
  const isRichlandDistricts = params.slug === 'richland-charter-amendment-for-council-districting'

  // Custom template for Richland Districts ballot measure
  if (isRichlandDistricts) {
    return (
      <>
        <OgHeader title="Should Richland Have Districts?" kicker="🗳️ Tri-Cities Vote" />
        <div className="og-competitors">
          <OgCompetitorCard name="" imageUrl={null} fallbackLabel="YES" />
          <div className="og-divider">
            <span>vs</span>
          </div>
          <OgCompetitorCard name="" imageUrl={null} fallbackLabel="NO" />
        </div>
      </>
    )
  }

  const visible = race.candidates
    .filter(({ candidate }) => !candidate.hide)
    .map(({ candidate }) => {
      const name = preferWikiString(candidate as any, 'name') ?? candidate.name
      const image = preferWikiString(candidate as any, 'image') ?? candidate.image ?? null
      return { name, image }
    })

  let left = visible[0]
  let right = visible[1]
  const extras = visible.length > 2 ? visible.length - 2 : 0

  if (!left && !right) {
    left = { name: 'Awaiting candidates', image: null }
    right = { name: 'Check back soon', image: null }
  } else if (left && !right) {
    right = { name: 'Uncontested', image: null }
  }

  return (
    <>
      <OgHeader title={displayTitle} subtitle={subtitle} />
      <div className="og-competitors">
        {left ? <OgCompetitorCard name={left.name} imageUrl={left.image} /> : null}
        <div className="og-divider">
          <span>vs</span>
        </div>
        {right ? (
          <OgCompetitorCard
            name={right.name}
            imageUrl={right.image}
            fallbackLabel={right.name === 'Uncontested' ? '—' : undefined}
          />
        ) : null}
      </div>
      {extras > 0 ? (
        <div className="og-footer">
          <strong>+{extras}</strong> more contender{extras === 1 ? '' : 's'} in this race.
        </div>
      ) : null}
    </>
  )
}

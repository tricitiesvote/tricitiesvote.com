import { OgHeader } from '@/components/og/OgHeader'
import { OgAvatar } from '@/components/og/OgAvatar'
import { getGuidesForYear, getCandidateByYearAndSlug } from '@/lib/queries'
import { preferWikiString } from '@/lib/wiki/utils'
import { slugify } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'

interface OgCandidatePageProps {
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
      for (const { candidate } of race.candidates) {
        const candidateSlug = slugify(candidate.name)
        if (!seen.has(candidateSlug)) {
          seen.add(candidateSlug)
          params.push({ year: String(year), slug: candidateSlug })
        }
      }
    }
  }

  return params
}

export default async function OgCandidatePage({ params }: OgCandidatePageProps) {
  const year = Number.parseInt(params.year, 10)
  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    notFound()
  }

  const candidate = await getCandidateByYearAndSlug(year, params.slug)
  if (!candidate) {
    notFound()
  }

  const candidateWithRelations = candidate as any
  const displayName = preferWikiString(candidateWithRelations, 'name') ?? candidate.name
  const image = preferWikiString(candidateWithRelations, 'image') ?? candidate.image ?? null
  const office = candidateWithRelations.office ?? candidateWithRelations.races?.[0]?.race?.office ?? null
  const officeTitle = office
    ? preferWikiString(office as any, 'title') ?? office.title
    : `Candidate`
  const cardLabel = `${officeTitle} • ${year} General Election`

  return (
    <>
      <OgHeader title={displayName} subtitle={cardLabel} />
      <div className="og-single-card">
        <OgAvatar name={displayName} imageUrl={image} />
        <p className="og-race-deck">Explore statements, engagement, and campaign finance on tricitiesvote.com.</p>
      </div>
    </>
  )
}

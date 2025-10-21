import { OgHeader } from '@/components/og/OgHeader'
import { OgAvatar } from '@/components/og/OgAvatar'
import { getAvailableYears, getGuidesForYear, getCandidateByYearAndSlug } from '@/lib/queries'
import { preferWikiString } from '@/lib/wiki/utils'
import { slugify } from '@/lib/utils'
import { notFound } from 'next/navigation'

interface OgCandidatePageProps {
  params: { year: string; slug: string }
}

export const revalidate = 3600

export async function generateStaticParams() {
  const years = await getAvailableYears()
  const params: Array<{ year: string; slug: string }> = []

  for (const year of years) {
    const guides = await getGuidesForYear(year)
    const seen = new Set<string>()

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
  }

  return params
}

export default async function OgCandidatePage({ params }: OgCandidatePageProps) {
  const year = Number.parseInt(params.year, 10)
  if (!Number.isFinite(year)) {
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

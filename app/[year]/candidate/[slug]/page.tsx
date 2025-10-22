import { getCandidateByYearAndSlug } from '@/lib/queries'
import { Candidate } from '@/components/candidate/Candidate'
import { ContactInline } from '@/components/ContactInline'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { buildBreadcrumbs } from '@/lib/officeDisplay'
import { createOgMetadata } from '@/lib/meta/og'
import { preferWikiString } from '@/lib/wiki/utils'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'

const primaryRaceFromCandidate = (candidate: any) => {
  const races = Array.isArray(candidate?.races) ? candidate.races : []
  const firstEntry = races[0]
  return firstEntry?.race ?? null
}

const officeFromCandidate = (candidate: any) => {
  if (candidate?.office) {
    return candidate.office
  }
  const primaryRace = primaryRaceFromCandidate(candidate)
  return primaryRace?.office ?? null
}

interface CandidatePageProps {
  params: {
    year: string
    slug: string
  }
}

export async function generateMetadata({ params }: CandidatePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    return createOgMetadata({
      title: 'Tri-Cities Vote',
      canonicalPath: '/',
      description: 'Nonpartisan voter guides for Tri-Cities elections'
    })
  }

  const candidate = await getCandidateByYearAndSlug(year, params.slug)

  if (!candidate) {
    notFound()
  }

  const displayName = preferWikiString(candidate as any, 'name') ?? candidate.name
  const office = officeFromCandidate(candidate)
  const officeTitle = office
    ? preferWikiString(office as any, 'title') ?? office.title
    : 'Candidate'

  return createOgMetadata({
    title: `${displayName} • ${officeTitle}`,
    description: `Read statements, questionnaire responses, and endorsements for ${displayName}, running for ${officeTitle} in ${year}.`,
    canonicalPath: `/${year}/candidate/${params.slug}`,
    imagePath: `og/${year}/candidate/${params.slug}.png`
  })
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    redirect('/')
  }

  const candidate = await getCandidateByYearAndSlug(year, params.slug)
  
  if (!candidate) {
    notFound()
  }
  
  const candidateWithRelations = candidate as any
  const displayName = preferWikiString(candidateWithRelations, 'name') ?? candidate.name

  // Calculate fundraising from contributions
  const contributions = Array.isArray(candidateWithRelations.contributions)
    ? candidateWithRelations.contributions
    : []
  const fundraising = calculateFundraising(contributions)
  
  // Get the race info for breadcrumb
  const race = primaryRaceFromCandidate(candidateWithRelations)
  const guide = race?.Guide?.[0]
  const region = guide?.region
  const breadcrumbs = buildBreadcrumbs({
    year,
    region,
    office: race?.office,
    candidateName: displayName
  }, { includeCandidate: true })
  
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
      
      <div className="container-candidate-large">
        <Candidate 
          candidate={candidateWithRelations} 
          year={year} 
          fullsize={true}
          fundraising={fundraising}
        />
      </div>
      <ContactInline />
    </>
  )
}

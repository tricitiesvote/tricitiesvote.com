import { getCandidateByYearAndSlug } from '@/lib/queries'
import { Candidate } from '@/components/candidate/Candidate'
import { ContactInline } from '@/components/ContactInline'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { slugify } from '@/lib/utils'
import { buildBreadcrumbs } from '@/lib/officeDisplay'

interface CandidatePageProps {
  params: {
    year: string
    slug: string
  }
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    notFound()
  }

  const candidate = await getCandidateByYearAndSlug(year, params.slug)
  
  if (!candidate) {
    notFound()
  }
  
  // Calculate fundraising from contributions
  const fundraising = calculateFundraising(candidate.contributions || [])
  
  // Get the race info for breadcrumb
  const race = candidate.races?.[0]?.race
  const guide = race?.Guide?.[0]
  const region = guide?.region
  const breadcrumbs = buildBreadcrumbs({
    year,
    region,
    office: race?.office,
    candidateName: candidate.name
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
          candidate={candidate} 
          year={year} 
          fullsize={true}
          fundraising={fundraising}
        />
      </div>
      <ContactInline />
    </>
  )
}

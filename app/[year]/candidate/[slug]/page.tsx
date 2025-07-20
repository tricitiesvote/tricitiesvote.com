import { getCandidateByYearAndSlug } from '@/lib/queries'
import { Candidate } from '@/components/candidate/Candidate'
import { ContactInline } from '@/components/ContactInline'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface CandidatePageProps {
  params: {
    year: string
    slug: string
  }
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const year = parseInt(params.year)
  const candidate = await getCandidateByYearAndSlug(year, params.slug)
  
  if (!candidate) {
    notFound()
  }
  
  // Calculate fundraising data from PDC if available
  const fundraising = candidate.pdc ? {
    total: 0, // This would come from PDC data
    donors: 0,
    topDonors: []
  } : null
  
  // Get the race info for breadcrumb
  const race = candidate.races?.[0]?.race
  const guide = race?.Guide?.[0]
  const region = guide?.region
  
  return (
    <>
      <nav>
        <Link href={`/${year}`}>{year} Election</Link>
        {region && (
          <>
            {' > '}
            <Link href={`/${year}/guide/${region.name.toLowerCase().replace(/\s+/g, '-')}`}>
              {region.name} Guide
            </Link>
          </>
        )}
        {race && (
          <>
            {' > '}
            <Link href={`/${year}/race/${race.office.title.toLowerCase().replace(/\s+/g, '-')}`}>
              {race.office.title}
            </Link>
          </>
        )}
        {' > '}
        {candidate.name}
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
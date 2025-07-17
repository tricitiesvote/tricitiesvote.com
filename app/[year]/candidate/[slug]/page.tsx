import { getCandidateByYearAndSlug } from '@/lib/queries'
import { CandidateProfile } from '@/components/candidate/CandidateProfile'
import { notFound } from 'next/navigation'

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
  
  return (
    <div className="candidate-page">
      <CandidateProfile candidate={candidate} year={year} />
    </div>
  )
}
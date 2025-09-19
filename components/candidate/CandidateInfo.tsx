import Link from 'next/link'
import { CandidateImage } from './CandidateImage'
import { CandidateLinkCollection } from './CandidateLinkCollection'
import { slugify } from '@/lib/utils'

interface CandidateInfoProps {
  candidate: {
    name: string
    image?: string | null
    email?: string | null
    website?: string | null
    facebook?: string | null
    twitter?: string | null
    instagram?: string | null
    youtube?: string | null
    pdc?: string | null
  }
  year: number
  size?: number
}

export function CandidateInfo({ candidate, year, size }: CandidateInfoProps) {
  const candidateSlug = slugify(candidate.name)
  const url = `/${year}/candidate/${candidateSlug}`
  
  return (
    <>
      <CandidateImage
        name={candidate.name}
        image={candidate.image}
        url={url}
        size={size}
      />
      <CandidateLinkCollection
        email={candidate.email}
        website={candidate.website}
        facebook={candidate.facebook}
        twitter={candidate.twitter}
        instagram={candidate.instagram}
        youtube={candidate.youtube}
        pdc={candidate.pdc}
      />
    </>
  )
}

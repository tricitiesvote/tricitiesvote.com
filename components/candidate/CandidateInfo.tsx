import Link from 'next/link'
import { CandidateImage } from './CandidateImage'
import { CandidateLinkCollection } from './CandidateLinkCollection'

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
}

export function CandidateInfo({ candidate, year }: CandidateInfoProps) {
  const candidateSlug = candidate.name.toLowerCase().replace(/\s+/g, '-')
  const url = `/${year}/candidate/${candidateSlug}`
  
  return (
    <>
      <CandidateImage
        name={candidate.name}
        image={candidate.image}
        url={url}
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
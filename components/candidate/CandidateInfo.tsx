import { CandidateImage } from './CandidateImage'
import { CandidateLinkCollection } from './CandidateLinkCollection'
import { slugify } from '@/lib/utils'
import { preferWikiString } from '@/lib/wiki/utils'

interface CandidateInfoProps {
  candidate: {
    id: string
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
  badge?: {
    label: string
    backgroundColor?: string
  } | null
}

export function CandidateInfo({ candidate, year, size, badge }: CandidateInfoProps) {
  const displayName = preferWikiString(candidate as any, 'name') ?? candidate.name
  const imageSrc = preferWikiString(candidate as any, 'image') ?? candidate.image ?? undefined
  const candidateSlug = slugify(candidate.name)
  const url = `/${year}/candidate/${candidateSlug}`
  
  return (
    <>
      <CandidateImage
        name={displayName}
        image={imageSrc}
        url={url}
        size={size}
        badge={badge}
      />
      <CandidateLinkCollection
        candidateId={candidate.id}
        email={preferWikiString(candidate as any, 'email') ?? candidate.email}
        website={preferWikiString(candidate as any, 'website') ?? candidate.website}
        facebook={preferWikiString(candidate as any, 'facebook') ?? candidate.facebook}
        twitter={preferWikiString(candidate as any, 'twitter') ?? candidate.twitter}
        instagram={preferWikiString(candidate as any, 'instagram') ?? candidate.instagram}
        youtube={preferWikiString(candidate as any, 'youtube') ?? candidate.youtube}
        pdc={candidate.pdc}
        phone={preferWikiString(candidate as any, 'phone')}
      />
    </>
  )
}

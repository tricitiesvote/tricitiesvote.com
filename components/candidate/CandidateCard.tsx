import Link from 'next/link'

interface CandidateCardProps {
  candidate: {
    id: string
    name: string
    slug: string
    nameWiki?: string | null
  }
  year: number
  showRace?: boolean
}

export function CandidateCard({ candidate, year, showRace = true }: CandidateCardProps) {
  const displayName = candidate.nameWiki && candidate.nameWiki.trim().length > 0
    ? candidate.nameWiki
    : candidate.name

  return (
    <div className="candidate-card">
      <header className="candidate-header">
        <h3>
          <Link href={`/${year}/candidate/${candidate.slug}`}>
            {displayName}
          </Link>
        </h3>
      </header>

      <div className="candidate-actions">
        <Link href={`/${year}/candidate/${candidate.slug}`} className="view-profile">
          View Profile
        </Link>
      </div>
    </div>
  )
}

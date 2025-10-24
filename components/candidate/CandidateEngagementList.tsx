import { cn } from '@/lib/utils'

type CandidateEngagementRecord = {
  participated: boolean
  notes?: string | null
  link?: string | null
  engagement: {
    id: string
    slug: string
    title: string
    date?: Date | string | null
    primaryLink?: string | null
    secondaryLink?: string | null
    secondaryLinkTitle?: string | null
    notes?: string | null
  } | null
}

export interface CandidateEngagementListProps {
  entries: CandidateEngagementRecord[]
  variant?: 'full' | 'compact'
}

/**
 * Format engagement titles for display
 * Titles are now stored cleanly in the database, so just display as-is
 */
function formatEngagementTitle(title: string): string {
  return title
}

export function CandidateEngagementList({
  entries,
  variant = 'full'
}: CandidateEngagementListProps) {
  // Filter and sort entries
  const sorted = [...entries]
    .filter(entry => entry.engagement)
    .sort((a, b) => {
      const aDate = toDateValue(a.engagement?.date)
      const bDate = toDateValue(b.engagement?.date)
      if (aDate && bDate) {
        return bDate.getTime() - aDate.getTime()
      }
      if (aDate) return -1
      if (bDate) return 1
      return (a.engagement?.title ?? '').localeCompare(b.engagement?.title ?? '')
    })

  if (sorted.length === 0) {
    return null
  }

  return (
    <div className={cn('engagement', variant === 'compact' && 'engagement-compact')}>
      <ul>
        {sorted.map(entry => {
          const engagement = entry.engagement!
          const displayTitle = formatEngagementTitle(engagement.title)
          const icon = entry.participated ? '✅' : '❌'

          // Use per-candidate link if available, otherwise fall back to engagement primaryLink
          let link = entry.link || engagement.primaryLink

          // For Tri-Cities Vote Q&A, append #tcv to jump to the questionnaire section
          if (link && engagement.slug?.startsWith('tri-cities-vote-q-a')) {
            link = link + '#tcv'
          }

          const content = link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {displayTitle}
            </a>
          ) : (
            <span>{displayTitle}</span>
          )

          return (
            <li
              key={`${engagement.id}-${entry.participated ? 'yes' : 'no'}`}
              className={cn(!entry.participated && 'engagement-missed')}
            >
              {icon} {content}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function toDateValue(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

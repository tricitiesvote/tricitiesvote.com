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

  const limit = variant === 'compact' ? 3 : sorted.length
  const displayEntries = sorted.slice(0, limit)

  return (
    <div className={cn('engagement', variant === 'compact' && 'engagement-compact')}>
      <ul>
        {displayEntries.map(entry => {
          const engagement = entry.engagement!
          const displayTitle = formatEngagementTitle(engagement.title)
          const icon = entry.participated ? '✅' : '❌'

          // Use per-candidate link if available, otherwise fall back to engagement primaryLink
          const link = entry.link || engagement.primaryLink

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
      {variant === 'compact' && sorted.length > displayEntries.length && (
        <p className="engagement-more">See full profile for more.</p>
      )}
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

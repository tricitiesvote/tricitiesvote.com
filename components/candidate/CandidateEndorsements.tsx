interface EndorsementProps {
  endorsements: Array<{
    id: string
    endorser: string
    url?: string | null
    filePath?: string | null
    sourceTitle?: string | null
    notes?: string | null
    type: string
    forAgainst: string
  }>
  showPlaceholder?: boolean
  stance?: 'MEASURE_YES' | 'MEASURE_NO'
}

type DisplayVariant = 'yes' | 'no'

type EndorsementEntry = EndorsementProps['endorsements'][number]

interface DisplayItem {
  id: string
  endorsement: EndorsementEntry
  variant: DisplayVariant
  // Every entry this item stands for; more than one when a writer sent
  // several letters, which then link as #1, #2, ... from a single pill
  sources: EndorsementEntry[]
}

export function CandidateEndorsements({ endorsements, showPlaceholder = true, stance }: EndorsementProps) {
  const displayList = computeDisplayList(endorsements, stance)

  if (displayList.length === 0) {
    if (!showPlaceholder) {
      return null
    }

    return (
      <div className="endorsements-summary">
        <p>No letters of support or opposition listed yet.</p>
      </div>
    )
  }

  return (
    <div className="endorsements-summary">
      <ul className="recs">
        {displayList.map(item => {
          const isPetition = item.endorsement.endorser.includes('3,800') || item.endorsement.endorser.includes('Petitioner')
          const liClass = item.variant === 'yes' ? 'yes' : 'no'
          return (
            <li key={item.id} className={isPetition ? `${liClass} endorsement-petition` : liClass}>
              {item.sources.length > 1 ? (
                <GroupedEndorsement endorsement={item.endorsement} sources={item.sources} />
              ) : (
                <EndorsementLink endorsement={item.endorsement} />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function computeDisplayList(
  endorsements: EndorsementProps['endorsements'],
  stance: EndorsementProps['stance']
): DisplayItem[] {
  return groupRepeatEndorsers(orderedEntries(endorsements, stance))
}

function orderedEntries(
  endorsements: EndorsementProps['endorsements'],
  stance: EndorsementProps['stance']
): Array<{ id: string; endorsement: EndorsementEntry; variant: DisplayVariant }> {
  if (endorsements.length === 0) {
    return []
  }

  if (stance === 'MEASURE_YES') {
    return endorsements
      .filter(entry => entry.forAgainst === 'FOR')
      .map(entry => ({ id: entry.id, endorsement: entry, variant: 'yes' as DisplayVariant }))
  }

  if (stance === 'MEASURE_NO') {
    return endorsements
      .filter(entry => entry.forAgainst === 'AGAINST')
      .map(entry => ({ id: entry.id, endorsement: entry, variant: 'yes' as DisplayVariant }))
  }

  // Sort endorsements: FOR first, then AGAINST
  // Within each group, prioritize petition entry (3,800 petitioners), then by ID/date
  const sorted = [...endorsements].sort((a, b) => {
    // Primary sort: FOR before AGAINST
    if (a.forAgainst === 'FOR' && b.forAgainst === 'AGAINST') return -1
    if (a.forAgainst === 'AGAINST' && b.forAgainst === 'FOR') return 1

    // Within same forAgainst group, prioritize petition entry
    const isPetitionA = a.endorser.includes('3,800') || a.endorser.includes('Petitioner')
    const isPetitionB = b.endorser.includes('3,800') || b.endorser.includes('Petitioner')

    if (isPetitionA && !isPetitionB) return -1
    if (!isPetitionA && isPetitionB) return 1

    // Otherwise maintain original order (by ID creation order)
    return a.id.localeCompare(b.id)
  })

  return sorted.map(entry => ({
    id: entry.id,
    endorsement: entry,
    variant: entry.forAgainst === 'FOR' ? 'yes' : 'no'
  }))
}

function groupRepeatEndorsers(
  entries: Array<{ id: string; endorsement: EndorsementEntry; variant: DisplayVariant }>
): DisplayItem[] {
  const groups = new Map<string, DisplayItem>()
  for (const entry of entries) {
    const key = `${entry.variant}|${entry.endorsement.endorser.trim().toLowerCase()}`
    const group = groups.get(key)
    if (group) {
      group.sources.push(entry.endorsement)
    } else {
      groups.set(key, { ...entry, sources: [entry.endorsement] })
    }
  }
  for (const group of groups.values()) {
    group.sources.sort((a, b) => sourceOrder(a) - sourceOrder(b))
  }
  return [...groups.values()]
}

// Herald article numbers only go up, so they number a writer's letters in the
// order they were published
function sourceOrder(entry: EndorsementEntry): number {
  const match = (entry.url || '').match(/article(\d+)/)
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER
}

function GroupedEndorsement({
  endorsement,
  sources
}: {
  endorsement: EndorsementEntry
  sources: EndorsementEntry[]
}) {
  return (
    <div className="endorsement-item">
      <span className="endorsement-name">{endorsement.endorser}</span>
      <span className="endorsement-sources">
        {sources.map((source, index) => {
          const href = source.url || source.filePath || null
          const label = `#${index + 1}`
          return href ? (
            <a key={source.id} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
          ) : (
            <span key={source.id}>{label}</span>
          )
        })}
      </span>
    </div>
  )
}

function EndorsementLink({
  endorsement
}: {
  endorsement: {
    id: string
    endorser: string
    url?: string | null
    filePath?: string | null
    sourceTitle?: string | null
    notes?: string | null
  }
}) {
  const href = endorsement.url || endorsement.filePath || null
  const label = endorsement.endorser
  const secondary = endorsement.sourceTitle || endorsement.notes || null

  return (
    <div className="endorsement-item">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ) : (
        <span>{label}</span>
      )}
      {secondary && (
        <span className="endorsement-meta"> — {secondary}</span>
      )}
    </div>
  )
}

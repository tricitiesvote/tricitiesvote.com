'use client'

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react'

export interface CompareSelectionCandidate {
  id: string
  name: string
  image: string | null
}

interface CompareSelectionState {
  pinned: string | null
  second: string | null
  active: boolean
  isVisible: (candidateId: string) => boolean
  orderedVisibleIds: string[]
}

const CompareSelectionContext = createContext<CompareSelectionState | null>(null)

export function useCompareSelection() {
  return useContext(CompareSelectionContext)
}

function lastName(name: string): string {
  const parts = name.replace(/"[^"]*"/g, '').trim().split(/\s+/)
  return parts[parts.length - 1] ?? name
}

interface CompareSelectionProviderProps {
  candidates: CompareSelectionCandidate[]
  children: ReactNode
}

// Soft-pin selection: the first chip clicked pins that candidate to the left
// slot until clicked again; further clicks rotate through the right slot.
export function CompareSelectionProvider({ candidates, children }: CompareSelectionProviderProps) {
  const [pinned, setPinned] = useState<string | null>(null)
  const [second, setSecond] = useState<string | null>(null)

  const selectCandidate = (id: string) => {
    if (id === pinned) {
      setPinned(null)
      setSecond(null)
      return
    }
    if (id === second) {
      setSecond(null)
      return
    }
    if (pinned === null) {
      setPinned(id)
      return
    }
    setSecond(id)
  }

  const active = pinned !== null
  const visibleCount = pinned && second ? 2 : pinned ? 1 : candidates.length

  const state: CompareSelectionState = {
    pinned,
    second,
    active,
    isVisible: id => !active || id === pinned || id === second,
    orderedVisibleIds: active
      ? ([pinned, second].filter(Boolean) as string[])
      : candidates.map(candidate => candidate.id),
  }

  return (
    <CompareSelectionContext.Provider value={state}>
      <div
        className={`compare-selection${active ? ' is-filtering' : ''}`}
        style={{ '--visible-columns': String(visibleCount) } as CSSProperties}
      >
        <div className="compare-selection-picker" role="group" aria-label="Choose candidates to compare">
          <p className="compare-selection-hint">
            {active
              ? second
                ? 'Comparing two candidates — click others to swap the right side, or click the pinned one to show everyone.'
                : 'Pinned. Click another candidate to compare side by side.'
              : 'Click a candidate to pin them, then click others to compare:'}
          </p>
          <ul className="compare-selection-rail">
            {candidates.map(candidate => {
              const isPinned = candidate.id === pinned
              const isSecond = candidate.id === second
              return (
                <li key={candidate.id}>
                  <button
                    type="button"
                    className={`compare-selection-chip${isPinned ? ' is-pinned' : ''}${isSecond ? ' is-selected' : ''}`}
                    aria-pressed={isPinned || isSecond}
                    onClick={() => selectCandidate(candidate.id)}
                  >
                    <span className="compare-selection-face">
                      {candidate.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={candidate.image} alt="" width={28} height={28} />
                      ) : (
                        <span className="compare-selection-initials">
                          {candidate.name.split(' ').map(part => part[0]).join('').toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="compare-selection-name">{lastName(candidate.name)}</span>
                    {isPinned && <span className="compare-selection-pin" aria-hidden="true">📌</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        {children}
      </div>
    </CompareSelectionContext.Provider>
  )
}

interface SelectableCompareCardProps {
  candidateId: string
  className: string
  children: ReactNode
}

// Client wrapper that hides server-rendered cards outside the selection.
export function SelectableCompareCard({ candidateId, className, children }: SelectableCompareCardProps) {
  const selection = useCompareSelection()

  if (selection && !selection.isVisible(candidateId)) {
    return null
  }

  const isPinned = selection?.active && selection.pinned === candidateId

  return (
    <div className={`${className}${isPinned ? ' is-pinned-card' : ''}`} style={isPinned ? { order: -1 } : undefined}>
      {children}
    </div>
  )
}

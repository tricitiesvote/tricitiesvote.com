'use client'

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react'

export interface CompareSelectionCandidate {
  id: string
  name: string
  image: string | null
}

interface CompareSelectionState {
  left: string | null
  right: string | null
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

// Nothing is shown until chips are clicked. The first selection becomes the
// pinned left-column reference; the second fills the right column, and
// further clicks swap the right side so you can walk the field against your
// pick. Clicking a shown candidate removes them.
export function CompareSelectionProvider({ candidates, children }: CompareSelectionProviderProps) {
  const [left, setLeft] = useState<string | null>(null)
  const [right, setRight] = useState<string | null>(null)

  const selectCandidate = (id: string) => {
    if (id === left) {
      setLeft(right)
      setRight(null)
      return
    }
    if (id === right) {
      setRight(null)
      return
    }
    if (left === null) {
      setLeft(id)
      return
    }
    setRight(id)
  }

  const visibleCount = [left, right].filter(Boolean).length

  const state: CompareSelectionState = {
    left,
    right,
    isVisible: id => id === left || id === right,
    orderedVisibleIds: [left, right].filter(Boolean) as string[],
  }

  const hint = left === null
    ? 'Click a candidate to start comparing:'
    : right === null
      ? 'Pinned to the left column — click another candidate to compare side by side.'
      : 'Click other candidates to swap the right side; click a selected one to remove them.'

  return (
    <CompareSelectionContext.Provider value={state}>
      <div
        className={`compare-selection${visibleCount > 0 ? ' is-filtering' : ''}`}
        style={{ '--visible-columns': String(Math.max(visibleCount, 1)) } as CSSProperties}
      >
        <div className="compare-selection-picker" role="group" aria-label="Choose candidates to compare">
          <p className="compare-selection-hint">{hint}</p>
          <ul className="compare-selection-rail">
            {candidates.map(candidate => {
              const isPinned = candidate.id === left
              const isSecond = candidate.id === right
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

// Client wrapper that hides server-rendered cards outside the selection and
// keeps the pinned candidate in the left column.
export function SelectableCompareCard({ candidateId, className, children }: SelectableCompareCardProps) {
  const selection = useCompareSelection()

  if (selection && !selection.isVisible(candidateId)) {
    return null
  }

  const isLeft = selection?.left === candidateId

  return (
    <div className={className} style={isLeft ? { order: -1 } : undefined}>
      {children}
    </div>
  )
}

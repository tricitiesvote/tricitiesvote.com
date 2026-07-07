'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export interface CompareSelectionCandidate {
  id: string
  name: string
  image: string | null
}

interface CompareSelectionState {
  left: string
  right: string
  pinned: boolean
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

// Exactly two candidates are visible at all times. Clicking a chip makes that
// candidate the pinned left-column reference; further clicks swap the right
// column, so you can walk the field against your pick. Clicking the pinned
// chip releases the stick without changing what's shown.
export function CompareSelectionProvider({ candidates, children }: CompareSelectionProviderProps) {
  const [left, setLeft] = useState<string>(candidates[0]?.id ?? '')
  const [right, setRight] = useState<string>(candidates[1]?.id ?? '')
  const [pinned, setPinned] = useState(false)

  const selectCandidate = (id: string) => {
    if (id === left) {
      setPinned(!pinned)
      return
    }
    if (id === right) {
      // Promote the right-column candidate to the pinned reference slot.
      setRight(left)
      setLeft(id)
      setPinned(true)
      return
    }
    if (pinned) {
      setRight(id)
      return
    }
    setLeft(id)
    setPinned(true)
  }

  const state: CompareSelectionState = {
    left,
    right,
    pinned,
    isVisible: id => id === left || id === right,
    orderedVisibleIds: [left, right].filter(Boolean),
  }

  return (
    <CompareSelectionContext.Provider value={state}>
      <div className="compare-selection is-filtering">
        <div className="compare-selection-picker" role="group" aria-label="Choose candidates to compare">
          <p className="compare-selection-hint">
            {pinned
              ? 'Pinned to the left column — click other candidates to compare against them, or click the pinned one to release.'
              : 'Click a candidate to pin them to the left column, then click through the rest to compare:'}
          </p>
          <ul className="compare-selection-rail">
            {candidates.map(candidate => {
              const isPinned = pinned && candidate.id === left
              const isShown = candidate.id === left || candidate.id === right
              return (
                <li key={candidate.id}>
                  <button
                    type="button"
                    className={`compare-selection-chip${isPinned ? ' is-pinned' : ''}${isShown && !isPinned ? ' is-selected' : ''}`}
                    aria-pressed={isShown}
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
// keeps the left-slot candidate in the left column.
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

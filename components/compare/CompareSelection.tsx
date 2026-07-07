'use client'

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react'

export interface CompareSelectionCandidate {
  id: string
  name: string
  image: string | null
}

export const MAX_COMPARE_SELECTION = 3

interface CompareSelectionState {
  left: string | null
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
// pinned left-column reference; later selections fill up to three columns,
// and once full, further clicks swap the rightmost slot so you can walk the
// field against your picks. Clicking a shown candidate removes them.
export function CompareSelectionProvider({ candidates, children }: CompareSelectionProviderProps) {
  const [selected, setSelected] = useState<string[]>([])

  const selectCandidate = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(entry => entry !== id))
      return
    }
    if (selected.length < MAX_COMPARE_SELECTION) {
      setSelected([...selected, id])
      return
    }
    setSelected([...selected.slice(0, MAX_COMPARE_SELECTION - 1), id])
  }

  const visibleCount = selected.length
  const left = selected[0] ?? null

  const state: CompareSelectionState = {
    left,
    isVisible: id => selected.includes(id),
    orderedVisibleIds: selected,
  }

  const hint = selected.length === 0
    ? 'Click a candidate to start comparing:'
    : selected.length < MAX_COMPARE_SELECTION
      ? 'Click more candidates to compare up to three side by side; click a selected one to remove them.'
      : 'Comparing three — click another candidate to swap the rightmost, or click a selected one to remove them.'

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
              const isSecond = selected.includes(candidate.id) && candidate.id !== left
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
// arranges columns in selection order (pinned reference first).
export function SelectableCompareCard({ candidateId, className, children }: SelectableCompareCardProps) {
  const selection = useCompareSelection()

  if (selection && !selection.isVisible(candidateId)) {
    return null
  }

  const position = selection ? selection.orderedVisibleIds.indexOf(candidateId) : -1

  return (
    <div className={className} style={position >= 0 ? { order: position } : undefined}>
      {children}
    </div>
  )
}

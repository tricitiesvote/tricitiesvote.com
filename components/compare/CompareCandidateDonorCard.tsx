'use client';

import { useState } from 'react'
import { CandidateDonorSummary } from '@/components/candidate/CandidateDonorSummary'

interface CompareCandidateDonorCardProps {
  fundraising?: {
    total: number
    donors: number
    topDonors: Array<{
      name: string
      amount: number
    }>
    totalCash?: number
    totalInKind?: number
  } | null
  minifiler: boolean
}

export function CompareCandidateDonorCard({ fundraising, minifiler }: CompareCandidateDonorCardProps) {
  const [expanded, setExpanded] = useState(false)

  if (minifiler || !fundraising) {
    return (
      <CandidateDonorSummary
        fundraising={fundraising}
        minifiler={minifiler}
        mini={false}
        className="donor-summary donor-summary-details"
      />
    )
  }

  return (
    <div className="compare-donor-card">
      {expanded ? (
        <>
          <CandidateDonorSummary
            fundraising={fundraising}
            minifiler={false}
            mini={false}
            className="donor-summary donor-summary-details"
          />
          <button
            type="button"
            className="candidate-card-toggle"
            onClick={() => setExpanded(false)}
          >
            Hide detail
          </button>
        </>
      ) : (
        <>
          <CandidateDonorSummary
            fundraising={fundraising}
            minifiler={false}
            mini={true}
            className="donor-summary donor-summary-preview"
          />
          <button
            type="button"
            className="candidate-card-toggle"
            onClick={() => setExpanded(true)}
          >
            Show detail
          </button>
        </>
      )}
    </div>
  )
}

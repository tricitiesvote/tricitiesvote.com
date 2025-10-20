'use client';

import { useState } from 'react'
import { CandidateDonorSummary } from './CandidateDonorSummary'

interface CandidateDonorCardProps {
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
  defaultExpanded: boolean
}

export function CandidateDonorCard({
  fundraising,
  minifiler,
  defaultExpanded
}: CandidateDonorCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const showToggle = !minifiler && Boolean(fundraising)

  if (!showToggle) {
    return (
      <div className="candidate-card-body candidate-card-body-donors">
        <CandidateDonorSummary
          fundraising={fundraising}
          minifiler={minifiler}
          mini={false}
          className="donor-summary donor-summary-details"
        />
      </div>
    )
  }

  return (
    <div className="candidate-card-body candidate-card-body-donors">
      <div className={expanded ? 'candidate-donor-preview hidden' : 'candidate-donor-preview'}>
        <CandidateDonorSummary
          fundraising={fundraising}
          minifiler={minifiler}
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
      </div>

      <div className={expanded ? 'candidate-donor-details visible' : 'candidate-donor-details'}>
        <CandidateDonorSummary
          fundraising={fundraising}
          minifiler={minifiler}
          mini={false}
          className="donor-summary donor-summary-details"
        />
        <button
          type="button"
          className="candidate-card-toggle candidate-card-toggle-hide"
          onClick={() => setExpanded(false)}
        >
          Hide detail
        </button>
      </div>
    </div>
  )
}

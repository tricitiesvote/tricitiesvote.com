'use client'

import React, { useState } from 'react'

interface DonorSummaryProps {
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
  mini?: boolean
}

export function CandidateDonorSummary({ fundraising, minifiler, mini = false }: DonorSummaryProps) {
  const [expandedDonors, setExpandedDonors] = useState<Set<number>>(new Set())
  
  if (minifiler || !fundraising) {
    return (
      <div className="donor-summary">
        <p>Self-funded / mini-filer</p>
      </div>
    )
  }
  
  if (mini) {
    const usd = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    
    return (
      <div className="donor-summary">
        <h3>Donors</h3>
        <p>
          💰{' '}
          <strong>
            {usd.format(fundraising.total)} from {fundraising.donors}
            <span
              className="why-plus"
              title="Why 'plus'? Sometimes multiple very small individual contributions are lumped together in one batch."
            >
              +
            </span>{' '}
            donors
          </strong>
          {fundraising.topDonors.length > 0 && (
            <>
              <span className="including">, including </span>
              {fundraising.topDonors.slice(0, 8).map((donor, index, arr) => (
                <span key={index} className="topdonors">
                  {donor.name}{' '}
                  <span className="topdonors-amount">({usd.format(donor.amount)})</span>
                  {index < arr.length - 1 && index < arr.length - 2 && ', '}
                  {index === arr.length - 2 && ' and '}
                </span>
              ))}
              .
            </>
          )}
        </p>
      </div>
    )
  }
  
  const handleToggle = (index: number) => {
    const newExpanded = new Set(expandedDonors)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedDonors(newExpanded)
  }
  
  const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  
  return (
    <div className="donor-summary">
      <h3>Donors</h3>
      <p>
        Reported raised {usd.format(fundraising.total)} from{' '}
        {fundraising.donors}
        <span
          className="why-plus"
          title="Why 'plus'? Sometimes multiple very small individual contributions are lumped together in one batch."
        >
          +
        </span>{' '}
        unique donors.{' '}
        {fundraising.totalCash !== undefined && fundraising.totalInKind !== undefined && (
          <span className="cash-vs-in-kind">
            ({usd.format(fundraising.totalCash)} in cash,{' '}
            {usd.format(fundraising.totalInKind)} in kind)
          </span>
        )}
      </p>
      <p className="helptext">
        Click the triangle to see more details and links to financial disclosure reports.
      </p>
      {fundraising.topDonors.length > 0 && (
        <div className="donors-list">
          {fundraising.topDonors.map((donor, index) => (
            <ul key={index} className={`donor ${expandedDonors.has(index) ? 'show-details' : ''}`}>
              <p>
                <button
                  aria-label="show/hide details"
                  type="button"
                  title="Show/hide details"
                  className="toggle-details"
                  onClick={() => handleToggle(index)}
                />
                {donor.name} ({usd.format(donor.amount)})
              </p>
              <li>
                Total: {usd.format(donor.amount)}
              </li>
              {/* Additional donation details would go here */}
            </ul>
          ))}
        </div>
      )}
    </div>
  )
}
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

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
  className?: string
}

export function CandidateDonorSummary({
  fundraising,
  minifiler,
  mini = false,
  className
}: DonorSummaryProps) {
  // Protective logic: if we have actual donation data, show it regardless of minifiler flag
  // This prevents false positives from the scraper from hiding real contributions
  const hasActualDonations = fundraising && fundraising.donors > 0

  if (minifiler && !hasActualDonations) {
    return (
      <div className={className ?? 'donor-summary'}>
        <p>Mini-filer: detailed reports N/A.</p>
      </div>
    )
  }

  if (!fundraising) {
    return (
      <div className={className ?? 'donor-summary'}>
        <p>No contributions reported yet.</p>
      </div>
    )
  }
  const donorCountLabel = `${fundraising.donors}+`
  const normalizedDonors = (fundraising.topDonors || []).map((donor, index) => {
    const formattedName = normalizeDonorName(donor.name)
    const safeName = formattedName || donor.name || 'Unknown Donor'

    return {
      key: `${safeName}-${index}`,
      name: safeName,
      amount: donor.amount,
    }
  })

  if (mini) {
    return (
      <div className={className ?? 'donor-summary'}>
        <h3>Donors</h3>
        <p>
          💰 <strong>{usd.format(fundraising.total)} from {donorCountLabel} donors</strong>
          {fundraising.totalCash !== undefined && fundraising.totalInKind !== undefined && (
            <span className="cash-vs-in-kind">
              {' '}
              ({usd.format(fundraising.totalCash)} cash / {usd.format(fundraising.totalInKind)} in-kind)
            </span>
          )}
          {normalizedDonors.length > 0 && ':'}
          {normalizedDonors.length > 0 && (
            <>
              {' including '}
              {normalizedDonors.slice(0, 8).map(donor => (
                <span key={donor.key} className="topdonors">
                  {donor.name}{' '}
                  <span className="topdonors-amount">({usd.format(donor.amount)})</span>
                </span>
              ))}
            </>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className={className ?? 'donor-summary'}>
      <h3>Donors</h3>
      <p>
        <strong>{usd.format(fundraising.total)} from {donorCountLabel} donors</strong>{' '}
        {fundraising.totalCash !== undefined && fundraising.totalInKind !== undefined && (
          <span className="cash-vs-in-kind">
            ({usd.format(fundraising.totalCash)} cash / {usd.format(fundraising.totalInKind)} in-kind)
          </span>
        )}
      </p>
      {normalizedDonors.length > 0 && (
        <ul className="donors">
          {normalizedDonors.map(donor => (
            <li key={donor.key}>
              <span className="donor-name">{donor.name}</span>
              <span className="donor-amount">{usd.format(donor.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const CORPORATE_KEYWORDS = /\b(LLC|INC|CORP|COMPANY|COMMITTEE|CAMPAIGN|PAC|ASSOCIATION|ASSOC|FUND|BANK|SCHOOL|DISTRICT|DEPARTMENT|PARTNERS|PARTNERSHIP|LP|LLP|PLC|PC|USA|FOUNDATION|GROUP|ENTERPRISES|HOTEL|RESORT|HOSPITAL|CLUB)\b/i
const SUFFIX_EXCEPTIONS = new Set(['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'JR', 'SR'])

function normalizeDonorName(name: string) {
  if (!name) {
    return ''
  }

  const withoutParen = name.replace(/\([^)]*\)/g, ' ')
  const cleaned = withoutParen.replace(/\s+/g, ' ').trim()

  if (!cleaned) {
    return ''
  }

  const segments = cleaned.split(',').map(part => part.trim()).filter(Boolean)
  let reordered = cleaned

  if (segments.length === 2 && !CORPORATE_KEYWORDS.test(cleaned)) {
    reordered = `${segments[1]} ${segments[0]}`.trim()
  } else if (segments.length > 1) {
    reordered = segments.join(' ')
  }

  const hasLetters = /[A-Za-z]/.test(reordered)
  const isAllCaps = hasLetters && reordered === reordered.toUpperCase()

  if (!isAllCaps) {
    return reordered.replace(/\s+/g, ' ').trim()
  }

  return toTitleCase(reordered).replace(/\s+/g, ' ').trim()
}

function toTitleCase(value: string) {
  return value
    .split(' ')
    .map(token => {
      if (!token) {
        return token
      }

      const upperToken = token.toUpperCase()
      if (SUFFIX_EXCEPTIONS.has(upperToken)) {
        return upperToken
      }

      return token
        .toLowerCase()
        .split('-')
        .map(segment => capitalizeSegment(segment))
        .join('-')
    })
    .join(' ')
}

function capitalizeSegment(segment: string) {
  if (!segment) {
    return segment
  }

  const lower = segment.toLowerCase()

  if (lower.length <= 2) {
    return lower.toUpperCase()
  }

  let result = lower.charAt(0).toUpperCase() + lower.slice(1)

  if (/^mc[a-z]/.test(result)) {
    result = result.replace(/^mc([a-z])/, (_, letter) => `Mc${letter.toUpperCase()}`)
  }

  if (/^o'[a-z]/.test(result)) {
    result = result.replace(/^o'([a-z])/, (_, letter) => `O'${letter.toUpperCase()}`)
  }

  return result
}

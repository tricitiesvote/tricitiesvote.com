interface DonorSummaryProps {
  fundraising?: {
    total: number
    donors: number
    topDonors: Array<{
      name: string
      amount: number
    }>
  } | null
  minifiler: boolean
  mini?: boolean
}

export function CandidateDonorSummary({ fundraising, minifiler, mini = false }: DonorSummaryProps) {
  if (minifiler || !fundraising) {
    return (
      <div className="donor-summary">
        <p>Self-funded / mini-filer</p>
      </div>
    )
  }
  
  if (mini) {
    return (
      <div className="donor-summary">
        <p>
          <strong>${fundraising.total.toLocaleString()}</strong> from{' '}
          <strong>{fundraising.donors}+</strong> donors
        </p>
      </div>
    )
  }
  
  return (
    <div className="donor-summary">
      <h3>Donors</h3>
      <p>
        Reported raised <strong>${fundraising.total.toLocaleString()}</strong> from{' '}
        <strong>{fundraising.donors}</strong> unique donors ($0 in cash, $0 in kind)
      </p>
      <p className="donors-note">
        Click the triangle to see more details and links to financial disclosure reports.
      </p>
      {fundraising.topDonors.length > 0 && (
        <ul className="donors">
          {fundraising.topDonors.map((donor, index) => (
            <li key={index}>
              {donor.name} (${donor.amount.toLocaleString()})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
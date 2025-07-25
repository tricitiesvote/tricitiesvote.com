interface Contribution {
  donorName: string
  amount: number
  cashOrInKind?: string | null
}

export interface FundraisingData {
  total: number
  donors: number
  topDonors: Array<{
    name: string
    amount: number
  }>
  totalCash: number
  totalInKind: number
}

export function calculateFundraising(contributions: Contribution[]): FundraisingData | null {
  if (!contributions || contributions.length === 0) {
    return null
  }

  // Group contributions by donor name
  const donorMap = new Map<string, number>()
  let totalCash = 0
  let totalInKind = 0
  
  contributions.forEach(contribution => {
    const current = donorMap.get(contribution.donorName) || 0
    donorMap.set(contribution.donorName, current + contribution.amount)
    
    if (contribution.cashOrInKind?.toLowerCase() === 'cash') {
      totalCash += contribution.amount
    } else if (contribution.cashOrInKind?.toLowerCase() === 'in-kind' || contribution.cashOrInKind?.toLowerCase() === 'in kind') {
      totalInKind += contribution.amount
    } else {
      // Default to cash if not specified
      totalCash += contribution.amount
    }
  })
  
  // Calculate totals
  const total = contributions.reduce((sum, c) => sum + c.amount, 0)
  const donors = donorMap.size
  
  // Get top donors
  const topDonors = Array.from(donorMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 20) // Top 20 donors
  
  return {
    total: Math.round(total),
    donors,
    topDonors,
    totalCash: Math.round(totalCash),
    totalInKind: Math.round(totalInKind)
  }
}
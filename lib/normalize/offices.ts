import { OfficeType } from '@prisma/client'

export interface NormalizedOffice {
  regionName: string
  officeType: OfficeType
  officeTitle: string
  jobTitle: string
  position: number | null
}

const CITY_LOOKUP: Array<{ match: string; label: string }> = [
  { match: 'WEST RICHLAND', label: 'West Richland' },
  { match: 'RICHLAND', label: 'Richland' },
  { match: 'KENNEWICK', label: 'Kennewick' },
  { match: 'PASCO', label: 'Pasco' }
]

function detectCity(jurisdiction: string, office: string): string | null {
  const haystacks = [jurisdiction, office].map(value => value.toUpperCase())

  for (const { match, label } of CITY_LOOKUP) {
    if (haystacks.some(text => text.includes(match))) {
      return label
    }
  }

  return null
}

interface SeatDetails {
  label: string
  position: number | null
}

function parseSeat(office: string): SeatDetails | null {
  const upper = office.toUpperCase()

  const wardMatch = upper.match(/WARD(?:\s+DISTRICT)?\s*#?(\d+)/)
  if (wardMatch) {
    const num = parseInt(wardMatch[1], 10)
    return { label: `Ward ${num}`, position: Number.isFinite(num) ? num : null }
  }

  const districtMatch = upper.match(/DISTRICT\s*#?(\d+)/)
  if (districtMatch) {
    const num = parseInt(districtMatch[1], 10)
    return { label: `District ${num}`, position: Number.isFinite(num) ? num : null }
  }

  const atLargeMatch = upper.match(/AT[- ]LARGE(?:\s*(?:POSITION|POS))?\s*#?(\d+)?/)
  if (atLargeMatch) {
    const numberText = atLargeMatch[1]
    if (numberText) {
      const num = parseInt(numberText, 10)
      return { label: `At-Large Position ${num}`, position: Number.isFinite(num) ? num : null }
    }
    return { label: 'At-Large', position: null }
  }

  const noMatch = upper.match(/NO\.?\s*#?(\d+)/)
  if (noMatch) {
    const num = parseInt(noMatch[1], 10)
    return { label: `Position ${num}`, position: Number.isFinite(num) ? num : null }
  }

  const posMatch = upper.match(/POS(?:ITION)?\s*#?(\d+)/)
  if (posMatch) {
    const num = parseInt(posMatch[1], 10)
    return { label: `Position ${num}`, position: Number.isFinite(num) ? num : null }
  }

  return null
}

function normalizeCityCouncil(office: string, jurisdiction: string): NormalizedOffice | null {
  const city = detectCity(jurisdiction, office)
  if (!city) {
    return null
  }

  const seat = parseSeat(office)
  if (!seat) {
    return null
  }

  return {
    regionName: city,
    officeType: OfficeType.CITY_COUNCIL,
    officeTitle: `${city} City Council ${seat.label}`.trim(),
    jobTitle: 'Council member',
    position: seat.position
  }
}

function normalizeSchoolBoard(office: string, jurisdiction: string): NormalizedOffice | null {
  const city = detectCity(jurisdiction, office)
  if (!city) {
    return null
  }

  const seat = parseSeat(office)
  if (!seat) {
    return null
  }

  return {
    regionName: city,
    officeType: OfficeType.SCHOOL_BOARD,
    officeTitle: `${city} School Board ${seat.label}`.trim(),
    jobTitle: 'School Board Director',
    position: seat.position
  }
}

function normalizePort(office: string): NormalizedOffice | null {
  const upper = office.toUpperCase()

  let regionName: string | null = null
  let portLabel: string | null = null
  if (upper.includes('PORT OF BENTON')) {
    regionName = 'Benton County'
    portLabel = 'Benton'
  } else if (upper.includes('PORT OF KENNEWICK')) {
    regionName = 'Kennewick'
    portLabel = 'Kennewick'
  } else if (upper.includes('PORT OF PASCO')) {
    regionName = 'Pasco'
    portLabel = 'Pasco'
  } else {
    return null
  }

  const seat = parseSeat(office)
  if (!seat) {
    return null
  }

  return {
    regionName,
    officeType: OfficeType.PORT_COMMISSIONER,
    officeTitle: `Port of ${portLabel} Commissioner ${seat.label}`.trim(),
    jobTitle: 'Commissioner',
    position: seat.position
  }
}

export function normalizeLocalOffice(params: {
  office: string
  jurisdiction: string
}): NormalizedOffice | null {
  const office = params.office || ''
  const jurisdiction = params.jurisdiction || ''
  const officeUpper = office.toUpperCase()

  if (officeUpper.includes('COUNCIL')) {
    return normalizeCityCouncil(office, jurisdiction)
  }

  if (officeUpper.includes('SCHOOL') || officeUpper.includes('DIRECTOR')) {
    return normalizeSchoolBoard(office, jurisdiction)
  }

  if (officeUpper.includes('PORT')) {
    return normalizePort(office)
  }

  return null
}

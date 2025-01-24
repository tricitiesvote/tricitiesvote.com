export interface Contribution {
  id: string
  filer_id: string
  election_year: string
  contributor_name: string
  contributor_address: string
  contributor_city: string
  contributor_state: string
  contributor_zip: string
  contributor_employer: string
  contributor_occupation: string
  contribution_amount: string
  contribution_date: string
  description: string
}

export interface Expenditure {
  id: string
  filer_id: string
  election_year: string
  vendor_name: string
  vendor_city: string
  vendor_state: string
  amount: string
  date: string
  description: string
}

export interface LastMinuteContribution {
  id: string
  filer_id: string
  election_year: string
  contributor_name: string
  amount: string
  date: string
}

export interface BaseFilter {
  election_year?: string
  jurisdiction?: string
  jurisdiction_county?: string
  legislative_district?: string
  filer_id?: string
}

export interface SocrataCredentials {
  apiId: string
  apiSecret: string
}
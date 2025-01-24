import { BaseFilter, SocrataCredentials } from './types'
import { SocrataClient } from './socrata'

export class WAStateClient {
  private client: SocrataClient
  private static JURISDICTIONS = [
    'CITY OF RICHLAND',
    'CITY OF KENNEWICK',
    'CITY OF WEST RICHLAND',
    'CITY OF PASCO'
  ]
  private static COUNTIES = ['BENTON', 'FRANKLIN']
  private static DISTRICTS = ['16', '08', '09', '8', '9']

  constructor(credentials?: SocrataCredentials) {
    this.client = new SocrataClient('data.wa.gov', credentials)
  }

  async *getContributions(filters: BaseFilter) {
    const endpoint = 'kv7h-kjye'
    const whereClause = this.buildWhereClause(filters)
    
    for await (const batch of this.client.queryWithPagination(endpoint, whereClause)) {
      yield batch
    }
  }

  async *getExpenditures(filters: BaseFilter) {
    const endpoint = 'tijg-9zyp'
    const whereClause = this.buildWhereClause(filters)
    
    for await (const batch of this.client.queryWithPagination(endpoint, whereClause)) {
      yield batch
    }
  }

  async *getLastMinuteContributions(filters: BaseFilter) {
    const endpoint = 'mppc-zjn9'
    const whereClause = this.buildWhereClause(filters)
    
    for await (const batch of this.client.queryWithPagination(endpoint, whereClause)) {
      yield batch
    }
  }

  private buildWhereClause(filters: BaseFilter): string {
    const conditions = []

    if (filters.election_year) {
      conditions.push(`election_year = '${filters.election_year}'`)
    }

    if (filters.jurisdiction) {
      conditions.push(`jurisdiction = '${filters.jurisdiction}'`)
    }

    if (filters.filer_id) {
      conditions.push(`filer_id = '${filters.filer_id}'`)
    }

    // Add our jurisdiction filters
    const jurisdictionConditions = [
      `jurisdiction IN (${WAStateClient.JURISDICTIONS.map(j => `'${j}'`).join(', ')})`,
      `jurisdiction_county IN (${WAStateClient.COUNTIES.map(c => `'${c}'`).join(', ')})`,
      `legislative_district IN (${WAStateClient.DISTRICTS.map(d => `'${d}'`).join(', ')})`
    ]

    conditions.push(`(${jurisdictionConditions.join(' OR ')})`)

    return conditions.join(' AND ')
  }
}
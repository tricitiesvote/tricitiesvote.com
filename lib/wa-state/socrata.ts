import { SocrataCredentials } from './types'

export class SocrataClient {
  private baseUrl: string
  private credentials?: SocrataCredentials
  private rateLimitDelay = 1000 // 1 second between requests

  constructor(domain: string, credentials?: SocrataCredentials) {
    this.baseUrl = `https://${domain}`
    this.credentials = credentials
  }

  async *queryWithPagination(endpoint: string, whereClause: string, batchSize = 1000) {
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const url = this.buildUrl(endpoint, whereClause, offset, batchSize)
      const response = await this.makeRequest(url)
      
      if ((response as any[]).length < batchSize) {
        hasMore = false
      }

      yield response as any[]
      offset += batchSize

      // Respect rate limits
      await this.sleep(this.rateLimitDelay)
    }
  }

  private buildUrl(endpoint: string, whereClause: string, offset: number, limit: number): string {
    const baseQuery = `${this.baseUrl}/resource/${endpoint}.json`
    const params = new URLSearchParams({
      $where: whereClause,
      $limit: limit.toString(),
      $offset: offset.toString()
    })

    return `${baseQuery}?${params.toString()}`
  }

  private async makeRequest(url: string) {
    const headers: HeadersInit = {
      'Accept': 'application/json'
    }

    if (this.credentials) {
      // Basic auth using API ID and Secret
      const authString = Buffer.from(
        `${this.credentials.apiId}:${this.credentials.apiSecret}`
      ).toString('base64')
      headers['Authorization'] = `Basic ${authString}`
    }

    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`)
    }

    return response.json()
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
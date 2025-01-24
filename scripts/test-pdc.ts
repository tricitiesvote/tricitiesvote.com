import { WAStateClient } from '../lib/wa-state'
import { NameMatcher } from '../lib/normalize/names'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function main() {
  const client = new WAStateClient({
    apiId: process.env.SOCRATA_API_ID!,
    apiSecret: process.env.SOCRATA_API_SECRET!
  })

  const nameMatcher = new NameMatcher()

  try {
    console.log('Fetching 2023 contributions...')
    let count = 0
    
    for await (const batch of client.getContributions({ election_year: '2023' })) {
      for (const contribution of batch) {
        count++
        if (count <= 5) {
          console.log('Sample contribution:', {
            contributor: contribution.contributor_name,
            amount: contribution.contribution_amount,
            date: contribution.contribution_date
          })
        }
      }
      
      // Just process first batch for testing
      break
    }
    
    console.log(`Processed ${count} contributions`)
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

main()
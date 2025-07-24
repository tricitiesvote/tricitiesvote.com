#!/usr/bin/env ts-node
// Debug PDC data to see actual field formats

import 'dotenv/config'
import { WAStateClient } from '../../lib/wa-state/client'

async function debugPDCData() {
  const client = new WAStateClient({
    apiId: process.env.SOCRATA_API_ID || '',
    apiSecret: process.env.SOCRATA_API_SECRET || ''
  })

  console.log('Fetching sample contributions for 2023...\n')
  
  let count = 0
  for await (const batch of client.getContributions({ election_year: '2023' })) {
    for (const contribution of (batch as any)) {
      count++
      
      // Show first 3 contributions in detail
      if (count <= 3) {
        console.log(`=== Contribution ${count} ===`)
        console.log(JSON.stringify(contribution, null, 2))
        console.log('\n')
      }
      
      // Show parsing attempts for first 10
      if (count <= 10) {
        console.log(`Contribution ${count}:`)
        console.log(`  filer_id: ${contribution.filer_id}`)
        console.log(`  contributor_name: ${contribution.contributor_name}`)
        console.log(`  contribution_amount: "${contribution.contribution_amount}"`)
        console.log(`  parsed amount: ${parseFloat(contribution.contribution_amount)}`)
        console.log('')
      }
      
      if (count >= 10) {
        console.log('Stopping after 10 samples...')
        return
      }
    }
  }
}

debugPDCData().catch(console.error)
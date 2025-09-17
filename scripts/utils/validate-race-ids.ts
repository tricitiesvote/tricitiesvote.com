#!/usr/bin/env npx tsx
/**
 * Validates which race IDs have pamphlet data available
 * 
 * Usage:
 *   npx tsx scripts/utils/validate-race-ids.ts <electionId> [raceIds...]
 * 
 * Examples:
 *   npx tsx scripts/utils/validate-race-ids.ts 893
 *   npx tsx scripts/utils/validate-race-ids.ts 893 162487 162488 162489
 */

const ELECTION_ID = process.argv[2]
const RACE_IDS = process.argv.slice(3)

// Default race IDs for known elections
const DEFAULT_RACE_IDS: Record<string, string[]> = {
  '893': [ // 2025 Primary
    "162487", "162488", "162489", "162490", "162491", "162493", "162505", "162506",
    "162583", "162584", "162602", "162603", "162604", "162605", "162607", "162621",
    "162622", "162623", "162625", "162682", "164278", "164279", "164351", "165057",
    "165654", "162816", "164348", "162908", "165056", "165491", "165492", "165493"
  ]
}

async function validateRaceIds(electionId: string, raceIds: string[]) {
  console.log(`🔍 Validating race IDs for election ${electionId}...\n`)
  
  const results = []
  let successCount = 0
  let emptyCount = 0
  
  for (const raceId of raceIds) {
    const url = `https://voter.votewa.gov/elections/candidate.ashx?e=${electionId}&r=${raceId}&la=&c=`
    
    try {
      const response = await fetch(url)
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        // Extract office title from first candidate
        const officeTitle = data[0]?.statement?.OfficeBallotTitle || 'Unknown'
        const candidates = data.map(d => d.statement?.BallotName || 'Unknown').join(', ')
        
        results.push({
          raceId,
          status: '✅',
          count: data.length,
          office: officeTitle,
          candidates: candidates
        })
        
        console.log(`✅ ${raceId}: ${data.length} candidates - ${officeTitle}`)
        if (candidates.length < 100) {
          console.log(`   Candidates: ${candidates}`)
        }
        successCount++
      } else {
        results.push({
          raceId,
          status: '❌',
          count: 0,
          office: 'No data',
          candidates: ''
        })
        console.log(`❌ ${raceId}: No data`)
        emptyCount++
      }
    } catch (error: any) {
      results.push({
        raceId,
        status: '⚠️',
        count: 0,
        office: 'Error',
        candidates: ''
      })
      console.log(`⚠️  ${raceId}: Error - ${error.message}`)
    }
    
    console.log('') // blank line between races
  }
  
  // Summary
  console.log('\n📊 Summary:')
  console.log(`   Election ID: ${electionId}`)
  console.log(`   Total race IDs checked: ${raceIds.length}`)
  console.log(`   Race IDs with data: ${successCount}`)
  console.log(`   Race IDs without data: ${emptyCount}`)
  console.log(`   Race IDs with errors: ${raceIds.length - successCount - emptyCount}`)
  
  // Export results
  if (successCount > 0) {
    console.log('\n📝 Race IDs with data:')
    const validRaceIds = results
      .filter(r => r.status === '✅')
      .map(r => `  "${r.raceId}", // ${r.office}`)
      .join('\n')
    console.log(validRaceIds)
  }
  
  return results
}

// Main execution
if (!ELECTION_ID) {
  console.error('❌ Error: Election ID is required')
  console.error('Usage: npx tsx scripts/utils/validate-race-ids.ts <electionId> [raceIds...]')
  process.exit(1)
}

const raceIdsToCheck = RACE_IDS.length > 0 ? RACE_IDS : DEFAULT_RACE_IDS[ELECTION_ID]

if (!raceIdsToCheck || raceIdsToCheck.length === 0) {
  console.error(`❌ Error: No race IDs provided and no defaults for election ${ELECTION_ID}`)
  console.error('Please provide race IDs as arguments')
  process.exit(1)
}

validateRaceIds(ELECTION_ID, raceIdsToCheck)
  .catch(console.error)
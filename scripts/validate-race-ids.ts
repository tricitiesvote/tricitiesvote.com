// Script to validate which race IDs have pamphlet data
const ELECTION_ID = 894
const RACE_IDS = [
  "166498", "166499", "166508", "166509", "166510", "166511", "166512",
  "166516", "166517", "166518", "166519", "166522", "166523", "166524",
  "166525", "166526", "166527", "166537", "166538"
]

async function validateRaceIds() {
  console.log('🔍 Validating race IDs for pamphlet data...\n')
  
  const results = []
  
  for (const raceId of RACE_IDS) {
    const url = `https://voter.votewa.gov/elections/candidate.ashx?e=${ELECTION_ID}&r=${raceId}&la=&c=`
    
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
        console.log(`   Candidates: ${candidates}`)
      } else {
        results.push({
          raceId,
          status: '❌',
          count: 0,
          office: 'No data',
          candidates: ''
        })
        console.log(`❌ ${raceId}: No data`)
      }
    } catch (error) {
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
  const withData = results.filter(r => r.status === '✅').length
  const noData = results.filter(r => r.status === '❌').length
  const errors = results.filter(r => r.status === '⚠️').length
  
  console.log('\n📊 Summary:')
  console.log(`   Race IDs with data: ${withData}`)
  console.log(`   Race IDs without data: ${noData}`)
  console.log(`   Race IDs with errors: ${errors}`)
  console.log(`   Total race IDs checked: ${RACE_IDS.length}`)
  
  // Show which candidates we found
  console.log('\n👥 All candidates found in pamphlet:')
  results.filter(r => r.status === '✅').forEach(r => {
    console.log(`\n${r.office} (${r.raceId}):`)
    r.candidates.split(', ').forEach(c => console.log(`   - ${c}`))
  })
}

validateRaceIds()

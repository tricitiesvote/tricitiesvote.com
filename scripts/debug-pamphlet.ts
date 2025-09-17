// Quick script to debug pamphlet API
async function debugPamphlet() {
  const raceId = '162488' // Race that has data
  const url = `https://voter.votewa.gov/elections/candidate.ashx?e=893&r=${raceId}&la=&c=`
  
  console.log(`Fetching: ${url}`)
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.length > 0) {
    console.log('\nFirst candidate full data:')
    console.log(JSON.stringify(data[0], null, 2))
    
    console.log('\n\nAvailable fields in statement:')
    if (data[0].statement) {
      Object.keys(data[0].statement).forEach(key => {
        const value = data[0].statement[key]
        if (value && typeof value === 'string' && value.length < 100) {
          console.log(`  ${key}: "${value}"`)
        } else if (value) {
          console.log(`  ${key}: [${typeof value}]`)
        }
      })
    }
  }
}

debugPamphlet()
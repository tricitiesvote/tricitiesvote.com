#!/usr/bin/env node
import * as cheerio from 'cheerio'

async function fetchRaceIds(electionId: string = '893') {
  console.log(`\n🔍 Fetching race IDs for election ${electionId}...\n`)
  
  const raceIds = new Set<string>()
  const raceDetails: { [key: string]: { office: string, candidates: string[] } } = {}
  
  // Benton County (03) - includes Kennewick, Richland, West Richland
  console.log('Fetching Benton County races...')
  const bentonUrl = `https://voter.votewa.gov/CandidateList.aspx?e=${electionId}&c=03`
  const bentonResponse = await fetch(bentonUrl)
  const bentonHtml = await bentonResponse.text()
  const $benton = cheerio.load(bentonHtml)
  
  // Franklin County (11) - includes Pasco
  console.log('Fetching Franklin County races...')
  const franklinUrl = `https://voter.votewa.gov/CandidateList.aspx?e=${electionId}&c=11`
  const franklinResponse = await fetch(franklinUrl)
  const franklinHtml = await franklinResponse.text()
  const $franklin = cheerio.load(franklinHtml)
  
  // Process both county pages
  const processPage = ($: cheerio.CheerioAPI, countyName: string) => {
    $('tr').each((_, row) => {
      const $row = $(row)
      const cells = $row.find('td')
      
      if (cells.length > 3) {
        const jurisdiction = $(cells[1]).text().trim()
        const office = $(cells[2]).text().trim()
        const candidateLink = $row.find('a[href*="/candidates/"]')
        
        // Filter for Tri-Cities area offices
        if (
          jurisdiction.includes('Kennewick') ||
          jurisdiction.includes('Pasco') ||
          jurisdiction.includes('Richland') ||
          jurisdiction.includes('Port of Benton') ||
          jurisdiction.includes('Port Of Kennewick') ||
          (jurisdiction.includes('School') && (
            jurisdiction.includes('Kennewick') ||
            jurisdiction.includes('Pasco') ||
            jurisdiction.includes('Richland')
          ))
        ) {
          const href = candidateLink.attr('href')
          if (href) {
            const match = href.match(/candidates\/(\d+)\/(\d+)/)
            if (match) {
              const raceId = match[1]
              const candidateName = candidateLink.text().trim()
              
              raceIds.add(raceId)
              
              if (!raceDetails[raceId]) {
                raceDetails[raceId] = {
                  office: `${jurisdiction} - ${office}`,
                  candidates: []
                }
              }
              raceDetails[raceId].candidates.push(candidateName)
            }
          }
        }
      }
    })
  }
  
  processPage($benton, 'Benton')
  processPage($franklin, 'Franklin')
  
  // Output results
  console.log('\n📋 Found Race IDs:\n')
  const sortedRaceIds = Array.from(raceIds).sort()
  
  sortedRaceIds.forEach(raceId => {
    const details = raceDetails[raceId]
    console.log(`${raceId} - ${details.office}`)
    details.candidates.forEach(candidate => {
      console.log(`  • ${candidate}`)
    })
  })
  
  console.log('\n📝 Race IDs for config file:')
  console.log(JSON.stringify(sortedRaceIds, null, 2))
  
  return sortedRaceIds
}

// Run if called directly
if (require.main === module) {
  const electionId = process.argv[2] || '893'
  fetchRaceIds(electionId)
    .catch(error => {
      console.error('Error:', error)
      process.exit(1)
    })
}
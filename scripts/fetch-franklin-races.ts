#!/usr/bin/env node
import * as cheerio from 'cheerio'

async function fetchFranklinRaces(electionId: string = '894') {
  console.log(`\n🔍 Fetching Franklin County races for election ${electionId}...\n`)
  
  const raceIds = new Set<string>()
  const raceDetails: { [key: string]: { office: string, candidates: string[] } } = {}
  
  // Franklin County (11) - includes Pasco
  const franklinUrl = `https://voter.votewa.gov/CandidateList.aspx?e=${electionId}&c=11`
  const franklinResponse = await fetch(franklinUrl)
  const franklinHtml = await franklinResponse.text()
  const $franklin = cheerio.load(franklinHtml)
  
  // Process ALL Franklin races to see what's available
  $franklin('tr').each((_, row) => {
    const $row = $franklin(row)
    const cells = $row.find('td')
    
    if (cells.length > 3) {
      const jurisdiction = $franklin(cells[1]).text().trim()
      const office = $franklin(cells[2]).text().trim()
      const candidateLink = $row.find('a[href*="/candidates/"]')
      
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
  })
  
  // Output results
  console.log('\n📋 ALL Franklin County Race IDs:\n')
  const sortedRaceIds = Array.from(raceIds).sort()
  
  sortedRaceIds.forEach(raceId => {
    const details = raceDetails[raceId]
    console.log(`${raceId} - ${details.office}`)
    details.candidates.forEach(candidate => {
      console.log(`  • ${candidate}`)
    })
  })
  
  // Filter for Pasco-specific races
  console.log('\n\n📋 Pasco/Port of Pasco Races:\n')
  sortedRaceIds.forEach(raceId => {
    const details = raceDetails[raceId]
    if (details.office.toLowerCase().includes('pasco') || 
        details.office.toLowerCase().includes('port of pasco')) {
      console.log(`${raceId} - ${details.office}`)
      details.candidates.forEach(candidate => {
        console.log(`  • ${candidate}`)
      })
    }
  })
  
  return sortedRaceIds
}

fetchFranklinRaces('894')
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

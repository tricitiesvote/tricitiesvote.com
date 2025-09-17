import { PrismaClient } from '@prisma/client'
import * as foldToAscii from 'fold-to-ascii'
import * as readline from 'readline/promises'
import * as fs from 'fs/promises'
import * as path from 'path'
import TurndownService from 'turndown'

const prisma = new PrismaClient()
const turndownService = new TurndownService()

// Known race ID to office mappings
const RACE_OFFICE_MAP: Record<string, { office: string, region: string }> = {
  "162488": { office: "City Council Position 7", region: "Richland" },
  "162506": { office: "School Board Director No. 2", region: "Kennewick" },
  "162583": { office: "City Council Ward District #1", region: "Kennewick" },
  "162602": { office: "City Council Ward District #3", region: "Kennewick" },
  "162603": { office: "City Council Position 4", region: "Kennewick" },
  "162621": { office: "City Council Position 3", region: "Richland" },
  "162622": { office: "City Council Position 6", region: "Richland" },
  "162623": { office: "City Council Position 4", region: "Richland" },
}

async function findUnmatchedCandidates() {
  console.log('🔍 Finding unmatched pamphlet candidates...\n')
  
  const unmatchedCandidates: any[] = []
  
  for (const [raceId, raceInfo] of Object.entries(RACE_OFFICE_MAP)) {
    const url = `https://voter.votewa.gov/elections/candidate.ashx?e=893&r=${raceId}&la=&c=`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.length > 0) {
      console.log(`\n📋 ${raceInfo.office} (${raceInfo.region}):`)
      
      for (const item of data) {
        if (item.statement?.BallotName) {
          const name = foldToAscii.foldReplacing(item.statement.BallotName)
          
          // Check if candidate exists
          const exists = await prisma.candidate.findFirst({
            where: {
              name: { contains: name.split(' ')[0], mode: 'insensitive' },
              electionYear: 2025
            }
          })
          
          if (!exists) {
            console.log(`   ❌ ${name} - NOT IN DATABASE`)
            unmatchedCandidates.push({
              name,
              raceId,
              ...raceInfo,
              data: item
            })
          } else {
            console.log(`   ✅ ${name} - Found as ${exists.name}`)
          }
        }
      }
    }
  }
  
  return unmatchedCandidates
}

async function matchCandidate(candidateData: any) {
  console.log(`\n🔎 Searching for matches for: ${candidateData.name}`)
  console.log(`   Office: ${candidateData.office} (${candidateData.region})`)
  
  // Search for similar names
  const nameParts = candidateData.name.split(' ')
  const lastName = nameParts[nameParts.length - 1]
  const firstName = nameParts[0]
  
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      OR: [
        { name: { contains: lastName, mode: 'insensitive' } },
        { name: { contains: firstName, mode: 'insensitive' } }
      ]
    },
    include: {
      office: {
        include: { region: true }
      }
    }
  })
  
  if (candidates.length === 0) {
    console.log('   No potential matches found')
    return null
  }
  
  console.log('\n   Potential matches:')
  candidates.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.name} - ${c.office.title} (${c.office.region.name})`)
  })
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const answer = await rl.question('\n   Select match (number) or press Enter to skip: ')
  rl.close()
  
  if (answer && parseInt(answer) > 0 && parseInt(answer) <= candidates.length) {
    return candidates[parseInt(answer) - 1]
  }
  
  return null
}

async function updateCandidate(candidate: any, pamphletData: any) {
  console.log(`\n📝 Updating ${candidate.name}...`)
  
  const updateData: any = {}
  
  // Update email if not set
  if (!candidate.email && pamphletData.data.statement.OrgEmail) {
    updateData.email = pamphletData.data.statement.OrgEmail
    console.log(`   Email: ${updateData.email}`)
  }
  
  // Update website if not set
  if (!candidate.website && pamphletData.data.statement.OrgWebsite) {
    updateData.website = pamphletData.data.statement.OrgWebsite.startsWith('http') 
      ? pamphletData.data.statement.OrgWebsite 
      : `http://${pamphletData.data.statement.OrgWebsite}`
    console.log(`   Website: ${updateData.website}`)
  }
  
  // Save photo if present and not set
  if (!candidate.image && pamphletData.data.statement.Photo) {
    const imageDir = path.join(process.cwd(), 'public/images/candidates/2025')
    await fs.mkdir(imageDir, { recursive: true })
    
    const filename = candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const photoPath = path.join(imageDir, `${filename}-original.png`)
    const photoBuffer = Buffer.from(pamphletData.data.statement.Photo, 'base64')
    await fs.writeFile(photoPath, photoBuffer)
    
    updateData.image = `/images/candidates/2025/${filename}-original.png`
    console.log(`   Photo saved`)
  }
  
  // Update statement if not set
  if (!candidate.statement && (pamphletData.data.statement.CandidateStatementText || pamphletData.data.statement.Statement)) {
    const statementHtml = pamphletData.data.statement.CandidateStatementText || pamphletData.data.statement.Statement
    updateData.statement = turndownService.turndown(statementHtml)
    console.log(`   Statement saved`)
  }
  
  if (Object.keys(updateData).length > 0) {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: updateData
    })
    console.log(`   ✅ Updated successfully`)
  } else {
    console.log(`   ℹ️  No updates needed`)
  }
}

async function main() {
  try {
    const unmatchedCandidates = await findUnmatchedCandidates()
    
    if (unmatchedCandidates.length === 0) {
      console.log('\n✅ All pamphlet candidates are matched!')
      return
    }
    
    console.log(`\n\n📊 Found ${unmatchedCandidates.length} unmatched candidates`)
    console.log('Let\'s try to match them...\n')
    
    for (const candidateData of unmatchedCandidates) {
      const match = await matchCandidate(candidateData)
      
      if (match) {
        await updateCandidate(match, candidateData)
      } else {
        console.log(`   ⚠️  Skipped ${candidateData.name}`)
      }
    }
    
    console.log('\n✅ Matching complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Check if we should run interactively
if (process.argv.includes('--auto')) {
  console.log('Running in auto mode - will only show unmatched candidates')
  findUnmatchedCandidates().then(candidates => {
    console.log(`\n\nFound ${candidates.length} unmatched candidates`)
    prisma.$disconnect()
  })
} else {
  main()
}
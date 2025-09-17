import { PrismaClient } from '@prisma/client'
import TurndownService from 'turndown'
import * as foldToAscii from 'fold-to-ascii'
import * as fs from 'fs/promises'
import * as path from 'path'

const prisma = new PrismaClient()
const turndownService = new TurndownService()

const ELECTION_ID = 893
const RACE_IDS = [
  "162487", "162488", "162489", "162490", "162491", "162493", "162505", "162506",
  "162583", "162584", "162602", "162603", "162604", "162605", "162607", "162621",
  "162622", "162623", "162625", "162682", "164278", "164279", "164351", "165057",
  "165654", "162816", "164348", "162908", "165056", "165491", "165492", "165493"
]

interface PamphletData {
  statement: {
    BallotName?: string
    Photo?: string
    HasPhoto?: boolean
    OrgEmail?: string
    OrgWebsite?: string
    OrgPhone?: string
    CandidateStatementText?: string
    Statement?: string
    OfficeBallotTitle?: string
  }
}

async function fetchAllPamphletCandidates() {
  console.log('🔍 Fetching ALL candidates from voter pamphlet...\n')
  
  const allCandidates: { name: string, office: string, raceId: string, data: PamphletData }[] = []
  
  for (const raceId of RACE_IDS) {
    const url = `https://voter.votewa.gov/elections/candidate.ashx?e=${ELECTION_ID}&r=${raceId}&la=&c=`
    const response = await fetch(url)
    const data: PamphletData[] = await response.json()
    
    for (const item of data) {
      if (item.statement?.BallotName) {
        const name = foldToAscii.foldReplacing(item.statement.BallotName)
        const office = item.statement.OfficeBallotTitle || 'Unknown Office'
        allCandidates.push({ name, office, raceId, data: item })
      }
    }
  }
  
  console.log(`📊 Found ${allCandidates.length} total candidates in pamphlet\n`)
  
  // Check which ones are missing from our database
  const existingCandidates = await prisma.candidate.findMany({
    where: { electionYear: 2025 },
    select: { name: true }
  })
  
  const existingNames = new Set(existingCandidates.map(c => c.name.toLowerCase()))
  
  const missingCandidates = allCandidates.filter(c => {
    // Try various name matching strategies
    const nameLower = c.name.toLowerCase()
    const nameVariations = [
      nameLower,
      nameLower.replace(/\s+/g, ' '), // normalize spaces
      nameLower.replace(/[^a-z\s]/g, ''), // remove special chars
    ]
    
    return !nameVariations.some(variation => {
      // Check if any existing candidate name contains this variation or vice versa
      return Array.from(existingNames).some(existing => 
        existing.includes(variation) || variation.includes(existing)
      )
    })
  })
  
  console.log(`\n❌ Missing ${missingCandidates.length} candidates from database:\n`)
  
  for (const candidate of missingCandidates) {
    console.log(`   - ${candidate.name} (${candidate.office})`)
  }
  
  return missingCandidates
}

async function inferRegionAndOffice(officeBallotTitle: string) {
  // Determine region based on office title
  let regionName = 'Kennewick' // default
  let officeType = 'CITY_COUNCIL'
  let officeTitle = officeBallotTitle
  
  if (officeBallotTitle.includes('PASCO')) {
    regionName = 'Pasco'
  } else if (officeBallotTitle.includes('RICHLAND') || officeBallotTitle.includes('WEST RICHLAND')) {
    regionName = 'Richland'
  } else if (officeBallotTitle.includes('KENNEWICK')) {
    regionName = 'Kennewick'
  } else if (officeBallotTitle.includes('BENTON')) {
    regionName = 'Benton County'
  } else if (officeBallotTitle.includes('FRANKLIN')) {
    regionName = 'Franklin County'
  }
  
  // Determine office type
  if (officeBallotTitle.includes('SCHOOL')) {
    officeType = 'SCHOOL_BOARD'
  } else if (officeBallotTitle.includes('PORT')) {
    officeType = 'PORT_COMMISSIONER'
  } else if (officeBallotTitle.includes('MAYOR')) {
    officeType = 'MAYOR'
  } else if (officeBallotTitle.includes('HOSPITAL')) {
    officeType = 'CITY_COUNCIL' // Using CITY_COUNCIL for hospital districts
  }
  
  // Clean up office title
  if (officeBallotTitle.includes('DISTRICT')) {
    const districtMatch = officeBallotTitle.match(/DISTRICT\s*(\d+)/i)
    if (districtMatch) {
      if (officeType === 'CITY_COUNCIL') {
        officeTitle = `City Council District ${districtMatch[1]}`
      } else if (officeType === 'SCHOOL_BOARD') {
        officeTitle = `Director District ${districtMatch[1]}`
      }
    }
  }
  
  return { regionName, officeType, officeTitle }
}

async function createMissingCandidates(missingCandidates: any[]) {
  console.log('\n\n📝 Creating missing candidates...\n')
  
  const imageDir = path.join(process.cwd(), 'public/images/candidates/2025')
  await fs.mkdir(imageDir, { recursive: true })
  
  for (const candidateData of missingCandidates) {
    console.log(`\n🔨 Creating: ${candidateData.name}`)
    
    const { regionName, officeType, officeTitle } = await inferRegionAndOffice(candidateData.office)
    
    // Find or create region
    const region = await prisma.region.findFirst({
      where: { name: regionName }
    })
    
    if (!region) {
      console.log(`  ❌ Region not found: ${regionName}`)
      continue
    }
    
    // Find or create office
    let office = await prisma.office.findFirst({
      where: {
        title: officeTitle,
        regionId: region.id
      }
    })
    
    if (!office) {
      let jobTitle = 'Councilmember'
      if (officeType === 'SCHOOL_BOARD') {
        jobTitle = 'School Board Director'
      } else if (officeType === 'PORT_COMMISSIONER') {
        jobTitle = 'Port Commissioner'
      } else if (officeType === 'MAYOR') {
        jobTitle = 'Mayor'
      }
      
      office = await prisma.office.create({
        data: {
          title: officeTitle,
          type: officeType,
          regionId: region.id,
          jobTitle: jobTitle
        }
      })
      console.log(`  ✅ Created office: ${officeTitle}`)
    }
    
    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        name: candidateData.name,
        electionYear: 2025,
        officeId: office.id,
        email: candidateData.data.statement.OrgEmail || null,
        website: candidateData.data.statement.OrgWebsite || null
      }
    })
    console.log(`  ✅ Created candidate: ${candidate.name}`)
    
    // Save photo if present
    if (candidateData.data.statement.Photo) {
      const filename = candidateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const photoPath = path.join(imageDir, `${filename}-original.png`)
      const photoBuffer = Buffer.from(candidateData.data.statement.Photo, 'base64')
      await fs.writeFile(photoPath, photoBuffer)
      
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { image: `/images/candidates/2025/${filename}-original.png` }
      })
      console.log(`  📸 Saved photo`)
    }
    
    // Save statement
    if (candidateData.data.statement.CandidateStatementText || candidateData.data.statement.Statement) {
      const statementHtml = candidateData.data.statement.CandidateStatementText || candidateData.data.statement.Statement
      const statementMarkdown = turndownService.turndown(statementHtml)
      
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { statement: statementMarkdown }
      })
      console.log(`  📝 Saved statement`)
    }
    
    // Find or create race
    let race = await prisma.race.findFirst({
      where: {
        officeId: office.id,
        electionYear: 2025,
        type: 'PRIMARY'
      }
    })
    
    if (!race) {
      race = await prisma.race.create({
        data: {
          electionYear: 2025,
          type: 'PRIMARY',
          officeId: office.id
        }
      })
      console.log(`  ✅ Created race`)
    }
    
    // Connect candidate to race
    const existingConnection = await prisma.candidateRace.findUnique({
      where: {
        candidateId_raceId: {
          candidateId: candidate.id,
          raceId: race.id
        }
      }
    })
    
    if (!existingConnection) {
      await prisma.candidateRace.create({
        data: {
          candidateId: candidate.id,
          raceId: race.id
        }
      })
      console.log(`  ✅ Connected to race`)
    }
  }
}

async function main() {
  try {
    const missingCandidates = await fetchAllPamphletCandidates()
    
    if (missingCandidates.length > 0) {
      console.log('\n💡 Would you like to create these missing candidates? (Check the output above)')
      console.log('   If yes, uncomment the line below and run again:')
      console.log('   // await createMissingCandidates(missingCandidates)')
      
      // Uncomment this line to actually create the candidates:
      await createMissingCandidates(missingCandidates)
    } else {
      console.log('\n✅ All pamphlet candidates are already in the database!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
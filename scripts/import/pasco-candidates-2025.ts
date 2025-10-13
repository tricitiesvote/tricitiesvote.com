import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Pasco candidates from voter pamphlet that aren't in our database yet
const PASCO_CANDIDATES = [
  // Pasco City Council
  { name: 'Mark Anthony Figueroa', office: 'CITY OF PASCO DISTRICT 1', position: 'Councilmember, District 1, Position 1' },
  { name: 'Leo Perales', office: 'CITY OF PASCO DISTRICT 3', position: 'Councilmember, District 3, Position 3' },
  { name: 'Bryan Verhei', office: 'CITY OF PASCO DISTRICT 3', position: 'Councilmember, District 3, Position 3' },
  { name: 'Pete Serrano', office: 'CITY OF PASCO DISTRICT 4', position: 'Councilmember, District 4, Position 4' },
  { name: 'Melissa Blasdel', office: 'CITY OF PASCO DISTRICT 6', position: 'Councilmember, District 6, Position 6' },
  { name: 'Calixto Hernandez', office: 'CITY OF PASCO DISTRICT 6', position: 'Councilmember, District 6, Position 6' },
  
  // Pasco School Board
  { name: 'Amanda Brown', office: 'PASCO SCHOOL DISTRICT, DIRECTOR DISTRICT 3', position: 'Director District 3' },
  { name: 'Steve Christensen', office: 'PASCO SCHOOL DISTRICT, DIRECTOR DISTRICT 3', position: 'Director District 3' },
  { name: 'Heather Kubalek', office: 'PASCO SCHOOL DISTRICT, DIRECTOR DISTRICT 4', position: 'Director District 4' },
  { name: 'Scott Lehrman', office: 'PASCO SCHOOL DISTRICT NO. 1', position: 'Director, At Large, Position 5' },
  { name: 'Valerie Torres', office: 'PASCO SCHOOL DISTRICT NO. 1', position: 'Director, At Large, Position 5' },
  
  // Pasco Port
  { name: 'Matt Watkins', office: 'PASCO PORT DISTRICT 2', position: 'Commissioner, District 2' },
  { name: 'Hans-Joachim Engelke', office: 'Pasco Port District 3', position: 'Commissioner, District 3' }
]

async function createPascoCandidates() {
  console.log('🏛️  Creating Pasco candidates for 2025...\n')
  
  try {
    // Get Pasco region
    const pascoRegion = await prisma.region.findFirst({
      where: { name: 'Pasco' }
    })
    
    if (!pascoRegion) {
      throw new Error('Pasco region not found!')
    }
    
    console.log(`✅ Found Pasco region: ${pascoRegion.name}\n`)
    
    // Create offices and candidates
    for (const candidateData of PASCO_CANDIDATES) {
      console.log(`\n📝 Processing: ${candidateData.name} for ${candidateData.office}`)
      
      // Determine office type
      let officeType = 'CITY_COUNCIL'
      if (candidateData.office.includes('SCHOOL')) {
        officeType = 'SCHOOL_BOARD'
      } else if (candidateData.office.includes('PORT')) {
        officeType = 'PORT_COMMISSIONER'
      }
      
      // Clean up office title
      let officeTitle = candidateData.position
      if (candidateData.office.includes('DISTRICT')) {
        const districtMatch = candidateData.office.match(/DISTRICT (\d+)/)
        if (districtMatch && officeType === 'CITY_COUNCIL') {
          officeTitle = `City Council District ${districtMatch[1]}`
        }
      }
      
      // Find or create office
      let office = await prisma.office.findFirst({
        where: {
          title: officeTitle,
          regionId: pascoRegion.id
        }
      })
      
      if (!office) {
        // Determine jobTitle based on office type
        let jobTitle = 'Councilmember'
        if (officeType === 'SCHOOL_BOARD') {
          jobTitle = 'School Board Director'
        } else if (officeType === 'PORT_COMMISSIONER') {
          jobTitle = 'Port Commissioner'
        }
        
        office = await prisma.office.create({
          data: {
            title: officeTitle,
            type: officeType,
            regionId: pascoRegion.id,
            jobTitle: jobTitle
          }
        })
        console.log(`  ✅ Created office: ${officeTitle}`)
      } else {
        console.log(`  ✓ Office exists: ${officeTitle}`)
      }
      
      // Check if candidate exists
      const existingCandidate = await prisma.candidate.findFirst({
        where: {
          name: candidateData.name,
          electionYear: 2025
        }
      })
      
      if (existingCandidate) {
        console.log(`  ✓ Candidate already exists: ${candidateData.name}`)
        continue
      }
      
      // Create candidate
      const candidate = await prisma.candidate.create({
        data: {
          name: candidateData.name,
          electionYear: 2025,
          officeId: office.id
        }
      })
      console.log(`  ✅ Created candidate: ${candidate.name}`)
      
      // Find or create race
      const existingRace = await prisma.race.findFirst({
        where: {
          officeId: office.id,
          electionYear: 2025,
          type: 'PRIMARY'
        }
      })
      
      if (!existingRace) {
        const race = await prisma.race.create({
          data: {
            electionYear: 2025,
            type: 'PRIMARY',
            officeId: office.id
          }
        })
        console.log(`  ✅ Created race for ${officeTitle}`)
        
        // Connect candidate to race via CandidateRace join table
        await prisma.candidateRace.create({
          data: {
            candidateId: candidate.id,
            raceId: race.id
          }
        })
      } else {
        // Connect candidate to existing race via CandidateRace join table
        const existingConnection = await prisma.candidateRace.findUnique({
          where: {
            candidateId_raceId: {
              candidateId: candidate.id,
              raceId: existingRace.id
            }
          }
        })
        
        if (!existingConnection) {
          await prisma.candidateRace.create({
            data: {
              candidateId: candidate.id,
              raceId: existingRace.id
            }
          })
        }
        console.log(`  ✓ Connected to existing race`)
      }
    }
    
    // Connect races to Pasco guide
    const pascoGuide = await prisma.guide.findFirst({
      where: {
        regionId: pascoRegion.id,
        electionYear: 2025
      }
    })
    
    if (pascoGuide) {
      const pascoRaces = await prisma.race.findMany({
        where: {
          electionYear: 2025,
          office: {
            regionId: pascoRegion.id
          }
        }
      })
      
      for (const race of pascoRaces) {
        const alreadyConnected = await prisma.guide.findFirst({
          where: {
            id: pascoGuide.id,
            Race: {
              some: { id: race.id }
            }
          }
        })
        
        if (!alreadyConnected) {
          await prisma.guide.update({
            where: { id: pascoGuide.id },
            data: {
              Race: {
                connect: { id: race.id }
              }
            }
          })
          console.log(`  ✅ Connected race to Pasco guide: ${race.id}`)
        }
      }
    }
    
    console.log('\n✅ Pasco candidate import complete!')
    
    // Show summary
    const totalCandidates = await prisma.candidate.count({
      where: {
        electionYear: 2025,
        office: {
          regionId: pascoRegion.id
        }
      }
    })
    
    const totalRaces = await prisma.race.count({
      where: {
        electionYear: 2025,
        office: {
          regionId: pascoRegion.id
        }
      }
    })
    
    console.log(`\n📊 Pasco Summary:`)
    console.log(`   Total candidates: ${totalCandidates}`)
    console.log(`   Total races: ${totalRaces}`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createPascoCandidates()
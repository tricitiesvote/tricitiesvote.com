import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupCandidates() {
  console.log('\nCleaning up duplicate candidates...')
  
  // Get all candidates grouped by stateId
  const candidates = await prisma.candidate.findMany({
    where: { electionYear: 2023 },
    include: {
      office: true,
      races: true,
      endorsements: true
    }
  })
  
  // Group candidates by stateId
  const candidatesByStateId = new Map<string, typeof candidates>()
  for (const candidate of candidates) {
    if (!candidate.stateId) continue
    const group = candidatesByStateId.get(candidate.stateId) || []
    group.push(candidate)
    candidatesByStateId.set(candidate.stateId, group)
  }
  
  // For each group of duplicates, keep the first one and delete the rest
  for (const [stateId, group] of candidatesByStateId.entries()) {
    if (group.length <= 1) continue
    
    console.log(`\nProcessing duplicate candidates for stateId=${stateId}`)
    console.log(`Found ${group.length} duplicates for ${group[0].name}`)
    
    // Keep the first one, delete the rest
    const [keep, ...remove] = group
    
    for (const dupe of remove) {
      // Delete the duplicate's relationships first
      await prisma.candidateRace.deleteMany({
        where: { candidateId: dupe.id }
      })
      
      await prisma.endorsement.deleteMany({
        where: { candidateId: dupe.id }
      })
      
      // Then delete the duplicate candidate
      await prisma.candidate.delete({
        where: { id: dupe.id }
      })
      
      console.log(`Deleted duplicate: ${dupe.name} (${dupe.id})`)
    }
  }
}

async function cleanupRaces() {
  console.log('\nCleaning up duplicate races...')
  
  // Get all races
  const races = await prisma.race.findMany({
    where: { electionYear: 2023 },
    include: {
      office: true,
      candidates: true
    }
  })
  
  // Group races by office and type
  const raceGroups = new Map<string, typeof races>()
  for (const race of races) {
    const key = `${race.office.title}|${race.type}`
    const group = raceGroups.get(key) || []
    group.push(race)
    raceGroups.set(key, group)
  }
  
  // For each group of duplicates, keep the one with candidates and delete the rest
  for (const [key, group] of raceGroups.entries()) {
    if (group.length <= 1) continue
    
    console.log(`\nProcessing duplicate races for ${key}`)
    console.log(`Found ${group.length} duplicates`)
    
    // Sort by number of candidates (keep the one with most candidates)
    group.sort((a, b) => b.candidates.length - a.candidates.length)
    
    const [keep, ...remove] = group
    
    for (const dupe of remove) {
      // Delete the duplicate's relationships first
      await prisma.candidateRace.deleteMany({
        where: { raceId: dupe.id }
      })
      
      // Then delete the duplicate race
      await prisma.race.delete({
        where: { id: dupe.id }
      })
      
      console.log(`Deleted duplicate race: ${dupe.office.title} (${dupe.type})`)
    }
  }
}

async function fixIncorrectRaces() {
  console.log('\nFixing incorrect race associations...')
  
  // Find the incorrect Kennewick City Council Pos 5 race
  const incorrectRace = await prisma.race.findFirst({
    where: {
      electionYear: 2023,
      office: {
        title: 'Kennewick City Council Pos 5'
      },
      type: 'GENERAL'
    },
    include: {
      candidates: {
        include: {
          candidate: true
        }
      }
    }
  })
  
  if (incorrectRace) {
    // Delete the incorrect race and its associations
    await prisma.candidateRace.deleteMany({
      where: { raceId: incorrectRace.id }
    })
    
    await prisma.race.delete({
      where: { id: incorrectRace.id }
    })
    
    console.log('Deleted incorrect race: Kennewick City Council Pos 5')
  }
}

async function main() {
  console.log('Starting cleanup...')
  
  try {
    await cleanupCandidates()
    await cleanupRaces()
    await fixIncorrectRaces()
    
    console.log('\nCleanup completed!')
  } catch (error) {
    console.error('Cleanup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 
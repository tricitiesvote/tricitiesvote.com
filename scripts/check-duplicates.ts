import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDuplicates() {
  // Check Kennewick races
  const kennewickRaces = await prisma.race.findMany({
    where: { 
      electionYear: 2025,
      office: { 
        region: { name: 'Kennewick' } 
      } 
    },
    include: { 
      office: true, 
      candidates: { 
        include: { candidate: true } 
      } 
    }
  })
  
  console.log('=== KENNEWICK RACES ===')
  for (const race of kennewickRaces) {
    console.log(`\n${race.office.title}:`)
    for (const cand of race.candidates) {
      console.log(`  - ${cand.candidate.name}`)
    }
  }
  
  // Check for duplicate candidates
  console.log('\n=== CHECKING FOR DUPLICATE CANDIDATES ===')
  const allCandidates = await prisma.candidate.findMany({
    where: { electionYear: 2025 },
    include: { races: { include: { race: { include: { office: true } } } } }
  })
  
  // Group by similar names
  const nameGroups = new Map<string, typeof allCandidates>()
  
  for (const candidate of allCandidates) {
    const lastName = candidate.name.split(' ').pop()?.toLowerCase() || ''
    if (!nameGroups.has(lastName)) {
      nameGroups.set(lastName, [])
    }
    nameGroups.get(lastName)!.push(candidate)
  }
  
  // Find potential duplicates
  for (const [lastName, candidates] of nameGroups) {
    if (candidates.length > 1) {
      console.log(`\nPotential duplicates with last name "${lastName}":`)
      for (const cand of candidates) {
        const offices = cand.races.map(r => r.race.office.title).join(', ')
        console.log(`  - ${cand.name} (ID: ${cand.id}) in: ${offices}`)
      }
    }
  }
}

checkDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
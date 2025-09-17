import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBentonRaces() {
  // Find all races that might be Benton County related
  const bentonRaces = await prisma.race.findMany({
    where: {
      electionYear: 2025,
      office: {
        OR: [
          { region: { name: 'Benton County' } },
          { title: { contains: 'Benton' } },
          { title: { contains: 'Port of Benton' } }
        ]
      }
    },
    include: {
      office: { include: { region: true } },
      candidates: { include: { candidate: true } }
    }
  })

  console.log('=== BENTON COUNTY RACES IN DATABASE ===')
  
  if (bentonRaces.length === 0) {
    console.log('No Benton County races found!')
  } else {
    bentonRaces.forEach(race => {
      console.log(`\n${race.office.title} (Region: ${race.office.region.name})`)
      race.candidates.forEach(cand => {
        console.log(`  - ${cand.candidate.name}`)
      })
    })
  }
  
  // Also check for Port of Benton in other regions
  console.log('\n=== CHECKING PORT OF BENTON IN ALL REGIONS ===')
  const portRaces = await prisma.race.findMany({
    where: {
      electionYear: 2025,
      office: {
        title: { contains: 'Port' }
      }
    },
    include: {
      office: { include: { region: true } },
      candidates: { include: { candidate: true } }
    }
  })
  
  portRaces.forEach(race => {
    console.log(`\n${race.office.title} (Region: ${race.office.region.name})`)
    race.candidates.forEach(cand => {
      console.log(`  - ${cand.candidate.name}`)
    })
  })
}

checkBentonRaces()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
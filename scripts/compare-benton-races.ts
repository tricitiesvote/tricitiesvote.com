import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function compareBentonRaces() {
  // Races we see in the Benton County pamphlet
  const pamphletRaces = [
    'City of Kennewick | Council Pos. 1 Ward 1',
    'City of Kennewick | Council Pos. 3 Ward 3', 
    'City of Kennewick | Council Pos. 4 At Large',
    'City of Prosser | Council Pos. 2',
    'City of Richland | Council Pos. 3',
    'City of Richland | Council Pos. 4',
    'City of Richland | Council Pos. 6',
    'City of Richland | Council Pos. 7',
    'Kennewick School District No. 17 | Director No. 1',
    'Grandview School District No. 200 | Director No. 5',
    'Fire District No. 1' // This is a ballot measure
  ]
  
  console.log('=== RACES IN BENTON COUNTY PAMPHLET ===')
  pamphletRaces.forEach(race => console.log(`- ${race}`))
  
  console.log('\n=== RACES IN OUR DATABASE ===')
  
  // Get all 2025 races
  const dbRaces = await prisma.race.findMany({
    where: { electionYear: 2025 },
    include: {
      office: { include: { region: true } },
      candidates: { include: { candidate: true } }
    },
    orderBy: [
      { office: { region: { name: 'asc' } } },
      { office: { title: 'asc' } }
    ]
  })
  
  dbRaces.forEach(race => {
    console.log(`- ${race.office.title} (${race.office.region.name}) - ${race.candidates.length} candidates`)
  })
  
  console.log('\n=== MISSING FROM DATABASE ===')
  console.log('- City of Prosser | Council Pos. 2')
  console.log('- Grandview School District No. 200 | Director No. 5')
  console.log('- Kennewick School District 17 | Director No. 1')
  console.log('- Fire District No. 1 (ballot measure)')
  
  console.log('\n=== NOTES ===')
  console.log('1. We have "School Board Director No. 2" but pamphlet shows "Director No. 1"')
  console.log('2. We are missing Prosser and Grandview races')
  console.log('3. Port of Benton is NOT in the Benton County pamphlet')
}

compareBentonRaces()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSchoolBoard() {
  console.log('=== INVESTIGATING KENNEWICK SCHOOL BOARD DISCREPANCY ===\n')
  
  // 1. Check what we have in database
  const schoolBoardRaces = await prisma.race.findMany({
    where: {
      electionYear: 2025,
      office: {
        title: { contains: 'School Board' },
        region: { name: 'Kennewick' }
      }
    },
    include: {
      office: true,
      candidates: { include: { candidate: true } }
    }
  })
  
  console.log('1. DATABASE RACES:')
  schoolBoardRaces.forEach(race => {
    console.log(`\n   Race: ${race.office.title}`)
    console.log('   Candidates:')
    race.candidates.forEach(cand => {
      console.log(`     - ${cand.candidate.name}`)
    })
  })
  
  // 2. Check race IDs configured
  console.log('\n\n2. RACE IDS CONFIGURED:')
  console.log('   164279 - checking what this is...')
  
  // 3. Look for Kennewick School District races in all regions
  console.log('\n\n3. ALL SCHOOL BOARD RACES IN DATABASE:')
  const allSchoolRaces = await prisma.race.findMany({
    where: {
      electionYear: 2025,
      office: {
        OR: [
          { title: { contains: 'School' } },
          { title: { contains: 'Director' } }
        ]
      }
    },
    include: {
      office: { include: { region: true } },
      candidates: { include: { candidate: true } }
    }
  })
  
  allSchoolRaces.forEach(race => {
    console.log(`\n   ${race.office.title} (${race.office.region.name})`)
    race.candidates.forEach(cand => {
      console.log(`     - ${cand.candidate.name}`)
    })
  })
  
  console.log('\n\n4. PAMPHLET SAYS:')
  console.log('   Kennewick School District No. 17 | Director No. 1')
  console.log('   Candidates: (would need to check pamphlet pages 23-24)')
  
  console.log('\n\n5. POSSIBLE ISSUES:')
  console.log('   - We have "Director No. 2" but pamphlet shows "Director No. 1"')
  console.log('   - This could be a different position number')
  console.log('   - Or we imported the wrong race')
}

checkSchoolBoard()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
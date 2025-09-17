import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSchoolBoardPosition() {
  console.log('=== FIXING KENNEWICK SCHOOL BOARD POSITION NUMBER ===\n')
  
  // Find the office with the wrong title
  const wrongOffice = await prisma.office.findFirst({
    where: {
      title: 'School Board Director No. 2',
      region: { name: 'Kennewick' }
    }
  })
  
  if (wrongOffice) {
    console.log('Found office to fix:')
    console.log(`  Current: ${wrongOffice.title}`)
    console.log(`  Should be: School Board Director No. 1`)
    
    // Update the office title
    await prisma.office.update({
      where: { id: wrongOffice.id },
      data: { title: 'School Board Director No. 1' }
    })
    
    console.log('\n✅ Fixed! Updated office title to match voter pamphlet')
  } else {
    console.log('❌ Could not find School Board Director No. 2 office')
  }
  
  // Verify the fix
  console.log('\n=== VERIFICATION ===')
  const fixedOffice = await prisma.office.findFirst({
    where: {
      title: 'School Board Director No. 1',
      region: { name: 'Kennewick' }
    },
    include: {
      races: {
        where: { electionYear: 2025 },
        include: {
          candidates: {
            include: { candidate: true }
          }
        }
      }
    }
  })
  
  if (fixedOffice && fixedOffice.races.length > 0) {
    console.log('New office title:', fixedOffice.title)
    console.log('Candidates:')
    fixedOffice.races[0].candidates.forEach(cand => {
      console.log(`  - ${cand.candidate.name}`)
    })
  }
}

fixSchoolBoardPosition()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
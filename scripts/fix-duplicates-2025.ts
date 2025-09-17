import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDuplicates() {
  console.log('=== FIXING 2025 DUPLICATE CANDIDATES ===\n')

  // 1. Fix John Trumbo duplicates
  console.log('1. Fixing John Trumbo duplicates...')
  
  // Find both John Trumbos
  const johnHTrumbo = await prisma.candidate.findFirst({
    where: { name: 'John H Trumbo', electionYear: 2025 },
    include: { 
      races: { include: { race: { include: { office: true } } } },
      contributions: true
    }
  })
  
  const johnTrumbo = await prisma.candidate.findFirst({
    where: { name: 'John Trumbo', electionYear: 2025 },
    include: { races: { include: { race: { include: { office: true } } } } }
  })
  
  if (johnHTrumbo && johnTrumbo) {
    // Move contributions from John H Trumbo to John Trumbo
    const contributionCount = johnHTrumbo.contributions.length
    if (contributionCount > 0) {
      await prisma.contribution.updateMany({
        where: { candidateId: johnHTrumbo.id },
        data: { candidateId: johnTrumbo.id }
      })
      console.log(`  - Moved ${contributionCount} contributions from John H Trumbo to John Trumbo`)
    }
    
    // Delete the generic race assignment
    await prisma.candidateRace.deleteMany({
      where: { candidateId: johnHTrumbo.id }
    })
    
    // Delete John H Trumbo
    await prisma.candidate.delete({
      where: { id: johnHTrumbo.id }
    })
    console.log('  - Deleted duplicate John H Trumbo')
  }
  
  // 2. Fix Tony/Anthony Sanchez duplicates
  console.log('\n2. Fixing Tony/Anthony Sanchez duplicates...')
  
  const anthonySanchez = await prisma.candidate.findFirst({
    where: { name: 'Anthony E Sanchez', electionYear: 2025 },
    include: { 
      races: { include: { race: { include: { office: true } } } },
      contributions: true
    }
  })
  
  const tonySanchez = await prisma.candidate.findFirst({
    where: { name: 'Tony Sanchez', electionYear: 2025 },
    include: { races: { include: { race: { include: { office: true } } } } }
  })
  
  if (anthonySanchez && tonySanchez) {
    // Move contributions from Anthony E Sanchez to Tony Sanchez
    const contributionCount = anthonySanchez.contributions.length
    if (contributionCount > 0) {
      await prisma.contribution.updateMany({
        where: { candidateId: anthonySanchez.id },
        data: { candidateId: tonySanchez.id }
      })
      console.log(`  - Moved ${contributionCount} contributions from Anthony E Sanchez to Tony Sanchez`)
    }
    
    // Delete the generic race assignment
    await prisma.candidateRace.deleteMany({
      where: { candidateId: anthonySanchez.id }
    })
    
    // Delete Anthony E Sanchez
    await prisma.candidate.delete({
      where: { id: anthonySanchez.id }
    })
    console.log('  - Deleted duplicate Anthony E Sanchez')
  }
  
  // 3. Check for Donald Landsman duplicates
  console.log('\n3. Checking for Donald Landsman duplicates...')
  
  const donaldC = await prisma.candidate.findFirst({
    where: { name: 'LANDSMAN DONALD C', electionYear: 2025 },
    include: { 
      races: { include: { race: { include: { office: true } } } },
      contributions: true
    }
  })
  
  const donald = await prisma.candidate.findFirst({
    where: { name: 'Donald Landsman', electionYear: 2025 },
    include: { races: { include: { race: { include: { office: true } } } } }
  })
  
  if (donaldC && donald) {
    // Move contributions from LANDSMAN DONALD C to Donald Landsman
    const contributionCount = donaldC.contributions.length
    if (contributionCount > 0) {
      await prisma.contribution.updateMany({
        where: { candidateId: donaldC.id },
        data: { candidateId: donald.id }
      })
      console.log(`  - Moved ${contributionCount} contributions from LANDSMAN DONALD C to Donald Landsman`)
    }
    
    // Delete the generic race assignment
    await prisma.candidateRace.deleteMany({
      where: { candidateId: donaldC.id }
    })
    
    // Delete LANDSMAN DONALD C
    await prisma.candidate.delete({
      where: { id: donaldC.id }
    })
    console.log('  - Deleted duplicate LANDSMAN DONALD C')
  }
  
  // 4. Clean up empty races
  console.log('\n4. Cleaning up empty races...')
  
  const emptyRaces = await prisma.race.findMany({
    where: { 
      electionYear: 2025,
      candidates: { none: {} }
    },
    include: { office: true }
  })
  
  for (const race of emptyRaces) {
    console.log(`  - Deleting empty race: ${race.office.title}`)
    await prisma.race.delete({ where: { id: race.id } })
  }
  
  // 5. Delete empty offices
  console.log('\n5. Cleaning up empty offices...')
  
  const emptyOffices = await prisma.office.findMany({
    where: { 
      races: { none: {} }
    }
  })
  
  for (const office of emptyOffices) {
    console.log(`  - Deleting empty office: ${office.title}`)
    await prisma.office.delete({ where: { id: office.id } })
  }
  
  console.log('\n✅ Duplicate fix complete!')
}

fixDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
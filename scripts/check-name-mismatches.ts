#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkNameMismatches() {
  const candidates = await prisma.candidate.findMany({
    where: { electionYear: 2025 },
    select: { name: true },
    orderBy: { name: 'asc' }
  })
  
  console.log('All 2025 candidate names in database:')
  candidates.forEach(c => console.log(`  - ${c.name}`))
  
  console.log('\nNames that failed to match from pamphlet:')
  console.log('  - Joshua Short')
  console.log('  - Tony Sanchez (DB has: Anthony E Sanchez)')
  console.log('  - Colin Michael')
  console.log('  - Ryan Whitten')
  console.log('  - Mike Luzzo')
  console.log('  - Micah Valentine')
  console.log('  - Tina Gregory')
  console.log('  - Jason McShane')
  console.log('  - Warren Hughs')
  console.log('  - Gloria Tyler Baker')
  console.log('  - Danielle Schuster')
  console.log('  - Robert Walko')
  console.log('  - Sandra Kent')
  console.log('  - Joshua Arnold')
  console.log('  - Kurt H Maier')
  console.log('  - Jordan Lee')
  console.log('  - John Maier')
  console.log('  - Donald Landsman (DB has: LANDSMAN DONALD C)')
  
  await prisma.$disconnect()
}

checkNameMismatches()
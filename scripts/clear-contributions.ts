#!/usr/bin/env ts-node
// Clear all contribution data to prepare for re-import

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearContributions() {
  console.log('Clearing all contribution data...')
  
  const deleted = await prisma.contribution.deleteMany({})
  console.log(`Deleted ${deleted.count} contributions`)
  
  // Also clear donor summaries
  const updated = await prisma.candidate.updateMany({
    where: { donors: { not: null } },
    data: { donors: null }
  })
  console.log(`Cleared donor summaries for ${updated.count} candidates`)
}

clearContributions()
  .then(() => console.log('Done!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect())
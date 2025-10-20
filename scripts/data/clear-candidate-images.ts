#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TARGETS: Array<{ name: string; year: number }> = [
  { name: 'John Maier', year: 2025 },
  { name: 'Nancy Aldrich', year: 2025 }
]

async function clearImages() {
  for (const target of TARGETS) {
    const result = await prisma.candidate.updateMany({
      where: {
        name: target.name,
        electionYear: target.year
      },
      data: {
        image: null,
        imageWiki: null
      }
    })

    console.log(`  • ${target.name} (${target.year}) => cleared ${result.count} record(s)`)}
}

async function main() {
  console.log('\n🧼 Clearing candidate images')
  await clearImages()
  console.log('✅ Done')
}

main()
  .catch(error => {
    console.error('❌ Failed to clear images:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

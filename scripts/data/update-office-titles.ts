#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DIRECT_REPLACEMENTS: Record<string, string> = {
  'Pasco School Board At-Large Position 5': 'Pasco School Board Pos 5',
  'Port of Benton Commissioner District 1': 'Port of Benton Commissioner',
  'Port of Kennewick Commissioner District 2': 'Port of Kennewick Commissioner',
}

const PATTERN_REPLACEMENTS: Array<{
  pattern: RegExp
  replacer: (match: RegExpMatchArray) => string
}> = [
  {
    pattern: /^Richland City Council Position (\d+)$/i,
    replacer: match => `Richland City Council Pos ${match[1]}`,
  },
  {
    pattern: /^Kennewick City Council Position (\d+)$/i,
    replacer: match => `Kennewick City Council Pos ${match[1]}`,
  },
  {
    pattern: /^West Richland City Council Position (\d+)$/i,
    replacer: match => `West Richland City Council Pos ${match[1]}`,
  },
  {
    pattern: /^Richland School Board Position (\d+)$/i,
    replacer: match => `Richland School Board Pos ${match[1]}`,
  },
]

async function renameOrMergeOffice(office: { id: string; regionId: string; title: string }, newTitle: string) {
  if (office.title === newTitle) {
    return
  }

  const conflict = await prisma.office.findFirst({
    where: {
      id: { not: office.id },
      regionId: office.regionId,
      title: newTitle,
    },
  })

  if (conflict) {
    await prisma.candidate.updateMany({
      where: { officeId: office.id },
      data: { officeId: conflict.id },
    })

    await prisma.race.updateMany({
      where: { officeId: office.id },
      data: { officeId: conflict.id },
    })

    await prisma.office.delete({ where: { id: office.id } })

    console.log(`  • merged ${office.title} into existing ${newTitle}`)
    return
  }

  await prisma.office.update({
    where: { id: office.id },
    data: { title: newTitle },
  })

  console.log(`  • ${office.title} → ${newTitle}`)
}

async function applyDirectReplacements() {
  for (const [from, to] of Object.entries(DIRECT_REPLACEMENTS)) {
    const offices = await prisma.office.findMany({ where: { title: from } })
    for (const office of offices) {
      await renameOrMergeOffice(office, to)
    }
  }
}

async function applyPatternReplacements() {
  const offices = await prisma.office.findMany()
  for (const office of offices) {
    for (const { pattern, replacer } of PATTERN_REPLACEMENTS) {
      const match = office.title.match(pattern)
      if (!match) continue

      const newTitle = replacer(match)
      await renameOrMergeOffice(office, newTitle)
      break
    }
  }
}

async function main() {
  console.log('\n✏️  Updating office titles for 2025 seats')
  await applyDirectReplacements()
  await applyPatternReplacements()
  console.log('✅ Title updates complete')
}

main()
  .catch(error => {
    console.error('❌ Failed to update office titles:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

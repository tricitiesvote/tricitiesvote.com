#!/usr/bin/env ts-node

import { PrismaClient, OfficeType, ElectionType } from '@prisma/client'

const prisma = new PrismaClient()

const YEAR = 2025
const PORT_RACE_GUIDES: Record<string, string[]> = {
  'Port of Benton Commissioner': ['Richland', 'West Richland'],
  'Port of Kennewick Commissioner': ['Kennewick']
}

async function getGuideId(regionName: string) {
  const region = await prisma.region.findFirst({ where: { name: regionName } })
  if (!region) return null

  const guide = await prisma.guide.findFirst({
    where: {
      electionYear: YEAR,
      regionId: region.id,
      type: ElectionType.GENERAL
    }
  })

  return guide?.id ?? null
}

async function reassignPortRaces() {
  const races = await prisma.race.findMany({
    where: {
      electionYear: YEAR,
      office: {
        type: OfficeType.PORT_COMMISSIONER
      }
    },
    include: {
      office: {
        include: { region: true }
      },
      Guide: true
    }
  })

  for (const race of races) {
    const targetRegions = PORT_RACE_GUIDES[race.office.title]
    if (!targetRegions) continue

    const guideIds: string[] = []
    for (const regionName of targetRegions) {
      const guideId = await getGuideId(regionName)
      if (guideId) {
        guideIds.push(guideId)
      }
    }

    if (guideIds.length === 0) {
      console.warn(`⚠️ Skipping ${race.office.title}; no target guides found.`)
      continue
    }

    await prisma.race.update({
      where: { id: race.id },
      data: {
        Guide: {
          set: guideIds.map(id => ({ id }))
        }
      }
    })

    console.log(`  • Linked ${race.office.title} to ${guideIds.length} guide(s).`)
  }
}

async function removeBentonCountyGuideIfEmpty() {
  const region = await prisma.region.findFirst({ where: { name: 'Benton County' } })
  if (!region) return

  const guide = await prisma.guide.findFirst({
    where: {
      electionYear: YEAR,
      regionId: region.id,
      type: ElectionType.GENERAL
    },
    include: { Race: true }
  })

  if (guide && guide.Race.length === 0) {
    await prisma.guide.delete({ where: { id: guide.id } })
    console.log('  • Removed empty Benton County guide')
  }
}

async function main() {
  console.log(`\n🔧 Reassigning port races for ${YEAR}`)
  await reassignPortRaces()
  await removeBentonCountyGuideIfEmpty()
  console.log('✅ Port guide reassignment complete.')
}

main()
  .catch(error => {
    console.error('❌ Failed to apply port guide fixes:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

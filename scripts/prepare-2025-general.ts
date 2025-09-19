#!/usr/bin/env ts-node

import { PrismaClient, ElectionType } from '@prisma/client'

const prisma = new PrismaClient()

const YEAR = 2025
const MUNICIPAL_REGIONS = ['Kennewick', 'Pasco', 'Richland', 'West Richland']

const PORT_RACE_GUIDES: Record<string, string[]> = {
  'Port of Benton Commissioner District 1': ['Richland', 'West Richland'],
  'Port of Kennewick Commissioner District 2': ['Kennewick']
}

async function ensureRegion(name: string) {
  let region = await prisma.region.findFirst({ where: { name } })
  if (!region) {
    region = await prisma.region.create({ data: { name } })
    console.log(`  • Created region ${name}`)
  }
  return region
}

async function ensureGuide(regionId: string, regionName: string) {
  let guide = await prisma.guide.findFirst({
    where: {
      electionYear: YEAR,
      regionId,
      type: ElectionType.GENERAL
    }
  })

  if (!guide) {
    guide = await prisma.guide.create({
      data: {
        electionYear: YEAR,
        regionId,
        type: ElectionType.GENERAL
      }
    })
    console.log(`  • Created general guide for ${regionName}`)
  }

  return guide
}

async function reassignWestRichlandOffices(westRichlandRegionId: string) {
  const offices = await prisma.office.findMany({
    where: { title: { contains: 'West Richland' } },
    select: { id: true, regionId: true, title: true }
  })

  for (const office of offices) {
    if (office.regionId !== westRichlandRegionId) {
      await prisma.office.update({
        where: { id: office.id },
        data: { regionId: westRichlandRegionId }
      })
      console.log(`  • Reassigned ${office.title} to West Richland`)
    }
  }
}

async function attachRaceToGuides(raceId: string, guideIds: string[]) {
  if (guideIds.length === 0) {
    return
  }

  await prisma.race.update({
    where: { id: raceId },
    data: {
      Guide: {
        set: guideIds.map(id => ({ id }))
      }
    }
  })
}

async function ensureGeneralRaceGuideLinks(guideMap: Map<string, string>) {
  const generalRaces = await prisma.race.findMany({
    where: {
      electionYear: YEAR,
      type: ElectionType.GENERAL
    },
    include: {
      Guide: true,
      office: {
        include: { region: true }
      }
    }
  })

  for (const race of generalRaces) {
    const guideIds = new Set<string>()

    const primaryGuideId = guideMap.get(race.office.region.name)
    if (primaryGuideId) {
      guideIds.add(primaryGuideId)
    }

    const portTargets = PORT_RACE_GUIDES[race.office.title]
    if (portTargets) {
      for (const targetRegion of portTargets) {
        const id = guideMap.get(targetRegion)
        if (id) {
          guideIds.add(id)
        }
      }
    }

    if (guideIds.size === 0) {
      continue
    }

    const currentIds = new Set(race.Guide.map(guide => guide.id))
    const needsUpdate = guideIds.size !== currentIds.size || [...guideIds].some(id => !currentIds.has(id))

    if (needsUpdate) {
      await attachRaceToGuides(race.id, [...guideIds])
      console.log(`  • Linked ${race.office.title} to ${[...guideIds].map(id => [...guideMap.entries()].find(([, value]) => value === id)?.[0]).filter(Boolean).join(', ')}`)
    }
  }
}

async function main() {
  console.log(`\n🗳️ Preparing ${YEAR} general election guides...\n`)

  const regionMap = new Map<string, string>()

  for (const name of MUNICIPAL_REGIONS) {
    const region = await ensureRegion(name)
    regionMap.set(name, region.id)
  }

  const westRichlandId = regionMap.get('West Richland')!
  await reassignWestRichlandOffices(westRichlandId)

  const guideMap = new Map<string, string>()
  for (const [name, id] of regionMap.entries()) {
    const guide = await ensureGuide(id, name)
    guideMap.set(name, guide.id)
  }

  await ensureGeneralRaceGuideLinks(guideMap)

  console.log('\n✅ General election guides ready.')
}

main()
  .catch(error => {
    console.error('❌ Failed to prepare 2025 general data:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

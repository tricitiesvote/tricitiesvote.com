#!/usr/bin/env ts-node

import { PrismaClient, ElectionType } from '@prisma/client'

const prisma = new PrismaClient()

const YEAR = 2025
const MUNICIPAL_REGIONS = ['Kennewick', 'Pasco', 'Richland', 'West Richland']
const SUPPORTING_REGIONS = ['Benton County']

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

async function attachRaceToGuide(raceId: string, guideId: string) {
  await prisma.race.update({
    where: { id: raceId },
    data: {
      Guide: {
        set: [{ id: guideId }]
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
    const targetGuideId = guideMap.get(race.office.region.name)
    if (!targetGuideId) continue

    const alreadyLinked = race.Guide.some(guide => guide.id === targetGuideId)
    if (!alreadyLinked || race.Guide.length > 1) {
      await attachRaceToGuide(race.id, targetGuideId)
      console.log(`  • Linked ${race.office.title} to ${race.office.region.name} guide`)
    }
  }
}

async function main() {
  console.log(`\n🗳️ Preparing ${YEAR} general election guides...\n`)

  const regionMap = new Map<string, string>()

  for (const name of [...MUNICIPAL_REGIONS, ...SUPPORTING_REGIONS]) {
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

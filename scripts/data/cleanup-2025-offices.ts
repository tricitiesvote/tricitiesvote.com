#!/usr/bin/env ts-node

import 'dotenv/config'
import { ElectionType, OfficeType, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const YEAR = 2025
const TARGET_TYPES = [OfficeType.CITY_COUNCIL, OfficeType.SCHOOL_BOARD, OfficeType.PORT_COMMISSIONER]
const TARGET_REGIONS = ['Kennewick', 'Pasco', 'Richland', 'West Richland', 'Benton County']

async function deleteGuideLinks(raceIds: string[]) {
  for (const raceId of raceIds) {
    await prisma.$executeRaw`DELETE FROM "_GuideRaces" WHERE "B" = ${raceId}`
  }
}

async function main() {
  console.log('🧹 Cleaning existing 2025 municipal data...')

  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: YEAR,
      office: {
        type: { in: TARGET_TYPES },
        region: { name: { in: TARGET_REGIONS } }
      }
    },
    select: { id: true }
  })

  const candidateIds = candidates.map(c => c.id)

  if (candidateIds.length) {
    console.log(`  • Removing ${candidateIds.length} candidates, races, and contributions`)
    await prisma.contribution.deleteMany({ where: { candidateId: { in: candidateIds } } })
    await prisma.candidateRace.deleteMany({ where: { candidateId: { in: candidateIds } } })
    await prisma.candidate.deleteMany({ where: { id: { in: candidateIds } } })
  }

  const races = await prisma.race.findMany({
    where: {
      electionYear: YEAR,
      OR: [
        { type: ElectionType.PRIMARY },
        {
          office: {
            type: { in: TARGET_TYPES },
            region: { name: { in: TARGET_REGIONS } }
          }
        }
      ]
    },
    select: { id: true }
  })

  const raceIds = races.map(r => r.id)
  await deleteGuideLinks(raceIds)
  if (raceIds.length) {
    await prisma.candidateRace.deleteMany({ where: { raceId: { in: raceIds } } })
    await prisma.race.deleteMany({ where: { id: { in: raceIds } } })
    console.log(`  • Deleted ${raceIds.length} races (primary + outdated general) for ${YEAR}`)
  }

  // Remove stray mayor data we don't cover
  const mayorOffice = await prisma.office.findFirst({ where: { title: 'Richland Mayor' } })
  if (mayorOffice) {
    const mayorCandidates = await prisma.candidate.findMany({
      where: { officeId: mayorOffice.id },
      select: { id: true }
    })
    const mayorCandidateIds = mayorCandidates.map(c => c.id)
    if (mayorCandidateIds.length) {
      await prisma.contribution.deleteMany({ where: { candidateId: { in: mayorCandidateIds } } })
      await prisma.candidateRace.deleteMany({ where: { candidateId: { in: mayorCandidateIds } } })
      await prisma.candidate.deleteMany({ where: { id: { in: mayorCandidateIds } } })
    }
    await prisma.race.deleteMany({ where: { officeId: mayorOffice.id } })
    await prisma.office.delete({ where: { id: mayorOffice.id } })
    console.log('  • Removed Richland Mayor office and related records')
  }

  console.log('✅ Cleanup complete.')
}

main()
  .catch(error => {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

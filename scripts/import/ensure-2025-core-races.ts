#!/usr/bin/env ts-node

import 'dotenv/config'
import { ElectionType, PrismaClient } from '@prisma/client'
import { normalizeLocalOffice } from '../../lib/normalize/offices'
import { CORE_SEAT_DEFINITIONS } from './2025-seats'

const prisma = new PrismaClient()
const YEAR = 2025

const candidateRenames: Array<{ oldName: string; newName: string }> = [
  { oldName: 'LANDSMAN DONALD C', newName: 'Donald Landsman' },
  { oldName: 'FREDERICK T BRINK', newName: 'Fred Brink' },
  { oldName: 'KECK,ROY D.', newName: 'Roy Keck' },
  { oldName: 'John H Trumbo', newName: 'John Trumbo' },
  { oldName: 'Anthony E Sanchez', newName: 'Tony Sanchez' },
  { oldName: 'ROBERT HARVEY PERKES', newName: 'Robert Harvey Perkes' },
  { oldName: 'Nic (Nicolas) Uhnak', newName: 'Nic Uhnak' }
]

async function renameCandidatesIfNeeded() {
  for (const { oldName, newName } of candidateRenames) {
    const existing = await prisma.candidate.findFirst({
      where: {
        electionYear: YEAR,
        name: oldName
      }
    })

    if (!existing || existing.name === newName) {
      continue
    }

    await prisma.candidate.update({
      where: { id: existing.id },
      data: { name: newName }
    })
    console.log(`  • Renamed candidate ${oldName} → ${newName}`)
  }
}

async function ensureRace(def: { office: string; jurisdiction: string; candidates: string[] }) {
  const normalized = normalizeLocalOffice({
    office: def.office,
    jurisdiction: def.jurisdiction
  })

  if (!normalized) {
    throw new Error(`Unable to normalize office "${def.office}" for ${def.jurisdiction}`)
  }

  const region = await prisma.region.findFirst({ where: { name: normalized.regionName } })
  if (!region) {
    throw new Error(`Region "${normalized.regionName}" not found`)
  }

  let office = await prisma.office.findFirst({
    where: {
      title: normalized.officeTitle,
      regionId: region.id
    }
  })

  if (!office) {
    office = await prisma.office.create({
      data: {
        title: normalized.officeTitle,
        type: normalized.officeType,
        regionId: region.id,
        jobTitle: normalized.jobTitle,
        position: normalized.position
      }
    })
    console.log(`  • Created office ${normalized.officeTitle} (${normalized.regionName})`)
  } else {
    await prisma.office.update({
      where: { id: office.id },
      data: {
        type: normalized.officeType,
        jobTitle: normalized.jobTitle,
        position: normalized.position
      }
    })
  }

  let race = await prisma.race.findFirst({
    where: {
      electionYear: YEAR,
      officeId: office.id,
      type: ElectionType.GENERAL
    }
  })

  if (!race) {
    race = await prisma.race.create({
      data: {
        electionYear: YEAR,
        officeId: office.id,
        type: ElectionType.GENERAL
      }
    })
    console.log(`  • Created general race for ${normalized.officeTitle}`)
  }

  for (const candidateName of def.candidates) {
    let candidate = await prisma.candidate.findFirst({
      where: {
        electionYear: YEAR,
        name: candidateName
      }
    })

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          name: candidateName,
          electionYear: YEAR,
          officeId: office.id
        }
      })
      console.log(`    • Created candidate ${candidateName}`)
    } else if (candidate.officeId !== office.id) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { officeId: office.id }
      })
    }

    await prisma.candidateRace.upsert({
      where: {
        candidateId_raceId: {
          candidateId: candidate.id,
          raceId: race.id
        }
      },
      update: {},
      create: {
        candidateId: candidate.id,
        raceId: race.id
      }
    })
  }

  await prisma.candidateRace.deleteMany({
    where: {
      raceId: race.id,
      candidateId: {
        notIn: await prisma.candidate.findMany({
          where: {
            electionYear: YEAR,
            name: { in: def.candidates }
          },
          select: { id: true }
        }).then(list => list.map(item => item.id))
      }
    }
  })
}

async function main() {
  console.log('🧭 Ensuring 2025 general races for core municipal contests...')

  await renameCandidatesIfNeeded()

  for (const race of CORE_SEAT_DEFINITIONS) {
    await ensureRace(race)
  }

  console.log('✅ Core municipal races ensured.')
}

main()
  .catch(error => {
    console.error('❌ Failed to ensure 2025 races:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

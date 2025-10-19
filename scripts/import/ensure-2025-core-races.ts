#!/usr/bin/env ts-node

import 'dotenv/config'
import { ElectionType, PrismaClient } from '@prisma/client'
import { normalizeLocalOffice } from '../../lib/normalize/offices'
import { CORE_SEAT_DEFINITIONS } from './2025-seats'

const prisma = new PrismaClient()
const YEAR = 2025

interface CandidateCacheItem {
  id: string
  name: string
  officeId: string | null
}

const candidateRenames: Array<{ oldName: string; newName: string }> = [
  { oldName: 'LANDSMAN DONALD C', newName: 'Donald Landsman' },
  { oldName: 'FREDERICK T BRINK', newName: 'Fred Brink' },
  { oldName: 'KECK,ROY D.', newName: 'Roy Keck' },
  { oldName: 'John H Trumbo', newName: 'John Trumbo' },
  { oldName: 'Anthony E Sanchez', newName: 'Tony Sanchez' },
  { oldName: 'ROBERT HARVEY PERKES', newName: 'Robert Harvey Perkes' },
  { oldName: 'Nic (Nicolas) Uhnak', newName: 'Nic Uhnak' },
  { oldName: 'Leo A Perales', newName: 'Leo Perales' },
  { oldName: 'Leo A. Perales', newName: 'Leo Perales' },
  { oldName: 'Leo Anthony Perales', newName: 'Leo Perales' },
  { oldName: 'Kurt Maier', newName: 'Kurt H Maier' },
  { oldName: 'Kurt H. Maier', newName: 'Kurt H Maier' }
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

function buildCandidateKey(name: string): string {
  const parts = name
    .replace(/[^A-Za-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.toUpperCase())

  if (!parts.length) {
    return ''
  }

  const first = parts[0]
  const last = parts[parts.length - 1]
  return `${first} ${last}`
}

async function ensureRace(def: { office: string; jurisdiction: string; candidates: string[] }, cache: CandidateCacheItem[]) {
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

  const linkedCandidateIds: string[] = []

  for (const candidateName of def.candidates) {
    const targetKey = buildCandidateKey(candidateName)

    let candidate = cache.find(item => item.name === candidateName && item.officeId === office.id)

    if (!candidate) {
      candidate = cache.find(item => item.officeId === office.id && buildCandidateKey(item.name) === targetKey)
    }

    if (!candidate) {
      candidate = cache.find(item => buildCandidateKey(item.name) === targetKey)
      if (candidate) {
        const previousName = candidate.name
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            name: candidateName,
            officeId: office.id
          }
        })
        console.log(`    • Normalized candidate ${previousName} → ${candidateName}`)
        candidate.name = candidateName
        candidate.officeId = office.id
      }
    }

    if (!candidate) {
      const created = await prisma.candidate.create({
        data: {
          name: candidateName,
          electionYear: YEAR,
          officeId: office.id
        }
      })
      console.log(`    • Created candidate ${candidateName}`)
      candidate = { id: created.id, name: created.name, officeId: created.officeId }
      cache.push(candidate)
    } else if (candidate.officeId !== office.id) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { officeId: office.id }
      })
      candidate.officeId = office.id
    }

    if (candidate.name !== candidateName) {
      const previousName = candidate.name
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { name: candidateName }
      })
      candidate.name = candidateName
      console.log(`    • Renamed candidate ${previousName} → ${candidateName}`)
    }

    linkedCandidateIds.push(candidate.id)

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
        notIn: linkedCandidateIds
      }
    }
  })

  const guide = await prisma.guide.findFirst({
    where: {
      electionYear: YEAR,
      regionId: region.id,
      type: ElectionType.GENERAL
    },
    select: { id: true }
  })

  if (guide) {
    try {
      await prisma.guide.update({
        where: { id: guide.id },
        data: {
          Race: {
            connect: { id: race.id }
          }
        }
      })
    } catch (error: any) {
      if (error?.code !== 'P2002') {
        throw error
      }
    }
  }
}

async function main() {
  console.log('🧭 Ensuring 2025 general races for core municipal contests...')

  await renameCandidatesIfNeeded()

  const candidateCache = await prisma.candidate.findMany({
    where: { electionYear: YEAR },
    select: { id: true, name: true, officeId: true }
  })

  for (const race of CORE_SEAT_DEFINITIONS) {
    await ensureRace(race, candidateCache)
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

import { PrismaClient, RegionType, OfficeType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.contribution.deleteMany()
  await prisma.stateIDMapping.deleteMany()
  await prisma.candidateRace.deleteMany()
  await prisma.candidate.deleteMany()
  await prisma.race.deleteMany()
  await prisma.election.deleteMany()
  await prisma.office.deleteMany()
  await prisma.region.deleteMany()

  // Create Cities
  const cities = await Promise.all([
    prisma.region.create({
      data: {
        type: RegionType.CITY,
        name: 'Kennewick',
        code: 'KWK',
      }
    }),
    prisma.region.create({
      data: {
        type: RegionType.CITY,
        name: 'Pasco',
        code: 'PSC',
      }
    }),
    prisma.region.create({
      data: {
        type: RegionType.CITY,
        name: 'Richland',
        code: 'RCH',
      }
    }),
    prisma.region.create({
      data: {
        type: RegionType.CITY,
        name: 'West Richland',
        code: 'WR',
      }
    })
  ])

  // Create School Districts
  const schoolDistricts = await Promise.all([
    prisma.region.create({
      data: {
        type: RegionType.SCHOOL_DISTRICT,
        name: 'Kennewick School District',
        code: 'KSD',
      }
    }),
    prisma.region.create({
      data: {
        type: RegionType.SCHOOL_DISTRICT,
        name: 'Pasco School District',
        code: 'PSD',
      }
    }),
    prisma.region.create({
      data: {
        type: RegionType.SCHOOL_DISTRICT,
        name: 'Richland School District',
        code: 'RSD',
      }
    })
  ])

  // Create Ports
  const ports = await Promise.all([
    prisma.region.create({
      data: {
        type: RegionType.PORT,
        name: 'Port of Benton',
        code: 'POB',
      }
    }),
    prisma.region.create({
      data: {
        type: RegionType.PORT,
        name: 'Port of Kennewick',
        code: 'POK',
      }
    }),
    prisma.region.create({
      data: {
        type: RegionType.PORT,
        name: 'Port of Pasco',
        code: 'POP',
      }
    })
  ])

  // Create City Council positions
  for (const city of cities) {
    for (let position = 1; position <= 7; position++) {
      await prisma.office.create({
        data: {
          type: OfficeType.LEGISLATIVE,
          title: `${city.name} City Council Position ${position}`,
          regionId: city.id,
          termLength: 4,
          sortOrder: position
        }
      })
    }
  }

  // Create School Board positions
  for (const district of schoolDistricts) {
    for (let position = 1; position <= 5; position++) {
      await prisma.office.create({
        data: {
          type: OfficeType.EDUCATIONAL,
          title: `${district.name} Board Position ${position}`,
          regionId: district.id,
          termLength: 4,
          sortOrder: position
        }
      })
    }
  }

  // Create Port Commissioner positions
  for (const port of ports) {
    for (let position = 1; position <= 3; position++) {
      await prisma.office.create({
        data: {
          type: OfficeType.COMMISSIONER,
          title: `${port.name} Commissioner District ${position}`,
          regionId: port.id,
          termLength: 6, // Port commissioners typically serve 6-year terms
          sortOrder: position
        }
      })
    }
  }

  // Create 2023 election
  const election2023 = await prisma.election.create({
    data: {
      year: 2023,
      type: 'GENERAL',
      startDate: new Date('2023-11-07'),
      endDate: new Date('2023-11-07')
    }
  })

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

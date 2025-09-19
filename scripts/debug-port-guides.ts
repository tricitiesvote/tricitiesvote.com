import { PrismaClient, OfficeType, ElectionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const races = await prisma.race.findMany({
    where: { electionYear: 2025, office: { type: OfficeType.PORT_COMMISSIONER } },
    include: {
      office: { include: { region: true } },
      Guide: { include: { region: true } }
    }
  })

  for (const race of races) {
    console.log(`Race: ${race.office.title}`)
    console.log(`  Office region: ${race.office.region.name}`)
    console.log(`  Guides:`)
    for (const guide of race.Guide) {
      console.log(`    - ${guide.region.name}`)
    }
  }
}

main().finally(() => prisma.$disconnect())

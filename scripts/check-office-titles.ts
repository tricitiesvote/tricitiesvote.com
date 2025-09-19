import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkOfficeTitles() {
  const offices = await prisma.office.findMany({
    where: {
      region: {
        name: { in: ['Kennewick', 'Pasco', 'Richland'] }
      }
    },
    include: { region: true },
    orderBy: [
      { region: { name: 'asc' } },
      { title: 'asc' }
    ]
  })

  console.log('\n📋 Office titles in database:\n')
  let currentRegion = ''
  offices.forEach(o => {
    if (o.region.name !== currentRegion) {
      currentRegion = o.region.name
      console.log(`\n${currentRegion}:`)
    }
    console.log(`  - ${o.title}`)
  })

  await prisma.$disconnect()
}

checkOfficeTitles()

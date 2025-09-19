import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPortCandidates() {
  // Check all 2025 candidates with "Port" in office
  const portCandidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      office: {
        title: { contains: 'Port' }
      }
    },
    include: {
      office: {
        include: { region: true }
      }
    }
  })

  console.log('\n📋 All Port candidates in 2025:')
  portCandidates.forEach(c => {
    console.log(`  - ${c.name} | ${c.office.title} | ${c.office.region.name}`)
  })

  // Check specifically for Matt Watkins
  const matt = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      name: { contains: 'Watkins' }
    },
    include: {
      office: {
        include: { region: true }
      }
    }
  })

  console.log('\n🔍 Searching for Watkins:')
  matt.forEach(c => {
    console.log(`  - ${c.name} | ${c.office.title} | ${c.office.region.name}`)
  })

  // Check for Engelke
  const engelke = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      OR: [
        { name: { contains: 'Engelke' } },
        { name: { contains: 'Hans' } }
      ]
    },
    include: {
      office: {
        include: { region: true }
      }
    }
  })

  console.log('\n🔍 Searching for Engelke/Hans:')
  engelke.forEach(c => {
    console.log(`  - ${c.name} | ${c.office.title} | ${c.office.region.name}`)
  })

  // Check what offices we have for Pasco region
  const pascoOffices = await prisma.office.findMany({
    where: {
      region: { name: 'Pasco' },
      title: { contains: 'Port' }
    }
  })

  console.log('\n📋 Port offices in Pasco region:')
  pascoOffices.forEach(o => {
    console.log(`  - ${o.id}: ${o.title}`)
  })

  await prisma.$disconnect()
}

checkPortCandidates()

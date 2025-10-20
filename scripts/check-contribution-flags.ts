#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run(year?: number) {
  const where = year ? { electionYear: year } : {}
  const summary = await prisma.contribution.groupBy({
    by: ['cashOrInKind'],
    _count: { cashOrInKind: true },
    _sum: { amount: true },
    where
  })

  console.log('\nContribution breakdown' + (year ? ` for ${year}` : ' (all years)'))
  summary.forEach(row => {
    const label = row.cashOrInKind ?? 'unspecified'
    const count = row._count.cashOrInKind
    const total = row._sum.amount ?? 0
    console.log(`  • ${label}: ${count} records, $${total.toFixed(2)}`)
  })
}

const yearArg = process.argv[2] ? parseInt(process.argv[2], 10) : undefined

run(yearArg)
  .catch(error => {
    console.error('Failed to summarize contributions:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

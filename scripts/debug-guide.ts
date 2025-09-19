#!/usr/bin/env ts-node
import { prisma } from '@/lib/db'
import { getGuideByYearAndRegion } from '@/lib/queries'

async function main() {
  const guide = await getGuideByYearAndRegion(2025, 'richland')
  console.log(guide)
}

main().finally(() => prisma.$disconnect())

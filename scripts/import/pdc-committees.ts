#!/usr/bin/env ts-node

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DATASET_BASE = 'https://data.wa.gov/resource/kv7h-kjye.json'
const PAGE_SIZE = 5000
const ELECTION_YEAR = 2025

interface CommitteeConfig {
  name: string
  committeeId: string
}

const COMMITTEES: CommitteeConfig[] = [
  { name: 'Pro Districts', committeeId: 'CO-2025-31659' },
  { name: 'Con Districts', committeeId: 'CO-2025-37825' }
]

interface ContributionRecord {
  transaction_id?: string
  filer_id?: string
  contributor_name?: string
  contributor_city?: string
  contributor_state?: string
  contributor_zip?: string
  contributor_employer?: string
  contributor_occupation?: string
  amount?: string
  receipt_date?: string
  cash_or_in_kind?: string
  description?: string
}

function normalizeContributionType(raw: string | undefined): string | null {
  if (!raw) return null
  const value = raw.trim().toLowerCase()
  if (value === 'cash') return 'cash'
  if (value === 'in-kind' || value === 'in kind' || value === 'inkind') return 'in-kind'
  return null
}

async function fetchAllContributions(committeeId: string): Promise<ContributionRecord[]> {
  const results: ContributionRecord[] = []
  let offset = 0

  while (true) {
    const url = new URL(DATASET_BASE)
    url.searchParams.set('$limit', PAGE_SIZE.toString())
    url.searchParams.set('$offset', offset.toString())
    url.searchParams.set('$order', 'receipt_date DESC')
    url.searchParams.set("filer_id", committeeId)

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-App-Token': process.env.SOCRATA_APP_TOKEN || ''
      }
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to fetch contributions for ${committeeId}: ${response.status} ${text}`)
    }

    const batch = (await response.json()) as ContributionRecord[]
    if (batch.length === 0) break

    results.push(...batch)
    if (batch.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return results
}

async function importCommittee(config: CommitteeConfig) {
  const candidate = await prisma.candidate.findFirst({
    where: {
      electionYear: ELECTION_YEAR,
      name: config.name
    }
  })

  if (!candidate) {
    console.warn(`⚠️  Candidate record '${config.name}' not found, skipping.`)
    return
  }

  console.log(`\n📥 Importing contributions for ${config.name} (${config.committeeId})`)
  const contributions = await fetchAllContributions(config.committeeId)
  console.log(`  • fetched ${contributions.length} transactions`)

  await prisma.contribution.deleteMany({ where: { candidateId: candidate.id } })

  const records = contributions.map((entry, index) => {
    const amount = entry.amount ? parseFloat(entry.amount) : 0
    const receiptDate = entry.receipt_date ? new Date(entry.receipt_date) : new Date()

    if (isNaN(receiptDate.getTime())) {
      console.warn(`    – skipping entry with invalid date (index ${index})`)
    }

    const normalizedDate = isNaN(receiptDate.getTime()) ? new Date() : receiptDate

    return {
      id: entry.transaction_id || `${config.committeeId}-${index}`,
      candidateId: candidate.id,
      electionYear: ELECTION_YEAR,
      donorName: entry.contributor_name || 'Unknown',
      donorCity: entry.contributor_city || null,
      donorState: entry.contributor_state || null,
      donorZip: entry.contributor_zip || null,
      donorEmployer: entry.contributor_employer || null,
      donorOccupation: entry.contributor_occupation || null,
      amount,
      date: normalizedDate,
      description: entry.description || null,
      cashOrInKind: normalizeContributionType(entry.cash_or_in_kind)
    }
  })

  await prisma.contribution.createMany({
    data: records,
    skipDuplicates: true
  })

  console.log(`  • inserted ${records.length} contributions into candidate ${candidate.id}`)
}

async function main() {
  try {
    for (const committee of COMMITTEES) {
      await importCommittee(committee)
    }
  } catch (error) {
    console.error('❌ Committee import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

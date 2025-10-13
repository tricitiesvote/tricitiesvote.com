import { PrismaClient } from '@prisma/client'
import { WAStateClient } from '../../lib/wa-state/client'
import { NameMatcher } from '../../lib/normalize/names'

const prisma = new PrismaClient()

// Statuses that indicate actual violations or warnings
export const VIOLATION_STATUSES = [
  'Violation Found by Commission',
  'Resolved by Attorney General - Violation',
  'Resolved by Citizen Under RCW 42.17A.765 - Violation',
  'Case Closed with Written Warning',
  'Case Closed with Reminder'
]

interface EnforcementCaseData {
  id: string
  case: string
  opened: string
  complainant: string
  respondent: string
  subject: string
  areas_of_law: string
  status: string
  description: string
  url: {
    url: string
  }
}

async function main() {
  // Check for incremental update mode
  const incrementalMode = process.argv.includes('--incremental')

  console.log(incrementalMode
    ? 'Fetching new/updated enforcement cases from PDC...'
    : 'Fetching ALL enforcement cases from PDC...')

  const client = new WAStateClient({
    apiId: process.env.SOCRATA_API_ID!,
    apiSecret: process.env.SOCRATA_API_SECRET!
  })

  // Fetch enforcement cases
  const endpoint = 'a4ma-dq6s'
  const socrataClient = (client as any).client

  // For incremental mode, only fetch cases updated after our last import
  let whereClause = ''
  if (incrementalMode) {
    const lastImport = await prisma.enforcementCase.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    })

    if (lastImport) {
      const lastDate = lastImport.updatedAt.toISOString().split('T')[0]
      whereClause = `updated_at > '${lastDate}'`
      console.log(`Fetching cases updated after ${lastDate}...`)
    }
  }

  let totalFetched = 0
  let totalMatched = 0
  let totalInserted = 0
  let totalUpdated = 0

  // First, build a name matcher with all candidates
  console.log('Building candidate name index...')
  const matcher = new NameMatcher()
  const candidates = await prisma.candidate.findMany({
    select: {
      id: true,
      name: true,
      electionYear: true
    }
  })

  for (const candidate of candidates) {
    matcher.addKnownName(candidate.name, candidate.id)
  }

  console.log(`Indexed ${candidates.length} candidates`)
  console.log('Fetching enforcement cases...')

  for await (const batch of socrataClient.queryWithPagination(endpoint, whereClause)) {
    for (const caseData of batch as EnforcementCaseData[]) {
      totalFetched++

      // Try to match respondent to a candidate
      const match = matcher.findMatch(caseData.respondent, 0.80)

      let candidateId: string | null = null
      let matchConfidence: number | null = null

      if (match.source !== 'none') {
        candidateId = match.normalizedName // This is actually the candidate ID
        matchConfidence = match.confidence
        totalMatched++
      }

      // Prepare enforcement case data
      const enforcementCase = {
        caseNumber: caseData.case,
        opened: new Date(caseData.opened),
        complainant: caseData.complainant,
        respondent: caseData.respondent,
        subject: caseData.subject,
        areasOfLaw: caseData.areas_of_law || 'Unknown',
        status: caseData.status,
        description: caseData.description || '',
        url: caseData.url.url,
        candidateId,
        matchConfidence,
        manuallyReviewed: false
      }

      // Upsert enforcement case
      try {
        const result = await prisma.enforcementCase.upsert({
          where: { caseNumber: caseData.case },
          create: enforcementCase,
          update: enforcementCase
        })

        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          totalInserted++
        } else {
          totalUpdated++
        }
      } catch (error) {
        console.error(`Error upserting case ${caseData.case}:`, error)
      }

      if (totalFetched % 100 === 0) {
        console.log(`Processed ${totalFetched} cases (${totalMatched} matched to candidates)...`)
      }
    }
  }

  console.log('\n=== Import Summary ===')
  console.log(`Total cases fetched: ${totalFetched}`)
  console.log(`Total matched to candidates: ${totalMatched}`)
  console.log(`Total inserted: ${totalInserted}`)
  console.log(`Total updated: ${totalUpdated}`)

  // Show unmatched cases for review
  const unmatched = await prisma.enforcementCase.findMany({
    where: { candidateId: null },
    select: {
      caseNumber: true,
      respondent: true,
      status: true
    },
    orderBy: { opened: 'desc' },
    take: 20
  })

  if (unmatched.length > 0) {
    console.log('\n=== Sample Unmatched Cases (for manual review) ===')
    unmatched.forEach(c => {
      console.log(`Case ${c.caseNumber}: ${c.respondent} - ${c.status}`)
    })
  }

  // Show matched cases with low confidence
  const lowConfidence = await prisma.enforcementCase.findMany({
    where: {
      candidateId: { not: null },
      matchConfidence: { lt: 0.9 }
    },
    include: {
      candidate: {
        select: {
          name: true,
          electionYear: true
        }
      }
    },
    orderBy: { matchConfidence: 'asc' },
    take: 20
  })

  if (lowConfidence.length > 0) {
    console.log('\n=== Low Confidence Matches (for manual review) ===')
    lowConfidence.forEach(c => {
      console.log(`Case ${c.caseNumber}: "${c.respondent}" → "${c.candidate?.name}" (${(c.matchConfidence! * 100).toFixed(1)}% confidence)`)
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

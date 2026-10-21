/**
 * Loads candidate-reported endorsement lists into ReportedEndorsement.
 *
 * Input: one or more JSON files, each an array of
 *   { candidateId, sourceUrl, endorsements: [{ endorser, category }] }
 * as gathered from the candidates' own campaign sites.
 *
 * A candidate's list is replaced wholesale, so re-running after a campaign
 * updates its page leaves no stale names behind. Candidates absent from the
 * input are left alone.
 *
 * Endorsement rows of type ORG or SOCIAL with no link are moved here too: the
 * written-endorsements list only carries entries that link to the endorser's
 * own words.
 *
 * Usage: npx tsx scripts/import/load-reported-endorsements.ts <file.json>... [--dry-run]
 */
import { PrismaClient, ReportedEndorserCategory } from '@prisma/client'
import { readFileSync } from 'fs'

const prisma = new PrismaClient()

interface InputCandidate {
  candidateId: string
  sourceUrl?: string | null
  endorsements: Array<{ endorser: string; category: ReportedEndorserCategory }>
}

const CATEGORIES = new Set(Object.values(ReportedEndorserCategory))

function legacyCategory(endorser: string): ReportedEndorserCategory {
  if (/^(Rtd|Retired|Former|Fmr)\b/i.test(endorser)) return 'FORMER_OFFICIAL'
  if (/\b(Senator|Rep|Representative|Councilmember|Commissioner|Mayor|Sheriff|Judge)\b/.test(endorser)) return 'CURRENT_OFFICIAL'
  return 'INDIVIDUAL'
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const files = process.argv.slice(2).filter(a => !a.startsWith('--'))
  const input: InputCandidate[] = files.flatMap(f => JSON.parse(readFileSync(f, 'utf8')))

  const lists = new Map<string, { sourceUrl: string | null; rows: Array<{ endorser: string; category: ReportedEndorserCategory }> }>()
  for (const c of input) {
    if (!c.endorsements.length) continue
    for (const e of c.endorsements) {
      if (!CATEGORIES.has(e.category)) throw new Error(`bad category ${e.category} for ${e.endorser}`)
    }
    lists.set(c.candidateId, { sourceUrl: c.sourceUrl ?? null, rows: [...c.endorsements] })
  }

  const legacy = await prisma.endorsement.findMany({
    where: { type: { in: ['ORG', 'SOCIAL'] }, url: null, filePath: null },
  })
  for (const e of legacy) {
    const list = lists.get(e.candidateId) ?? { sourceUrl: null, rows: [] }
    const seen = new Set(list.rows.map(r => r.endorser.toLowerCase()))
    if (!seen.has(e.endorser.toLowerCase())) {
      list.rows.push({ endorser: e.endorser, category: e.type === 'ORG' ? 'ORGANIZATION' : legacyCategory(e.endorser) })
    }
    lists.set(e.candidateId, list)
  }

  let total = 0
  for (const [candidateId, list] of lists) {
    total += list.rows.length
    console.log(`${candidateId}: ${list.rows.length} endorsers`)
    if (dryRun) continue
    await prisma.$transaction([
      prisma.reportedEndorsement.deleteMany({ where: { candidateId } }),
      prisma.reportedEndorsement.createMany({
        data: list.rows.map((r, position) => ({
          candidateId,
          endorser: r.endorser,
          category: r.category,
          position,
          sourceUrl: list.sourceUrl,
        })),
      }),
    ])
  }
  console.log(`${lists.size} candidates, ${total} endorsers, ${legacy.length} unlinked endorsements moved${dryRun ? ' (dry run)' : ''}`)
  if (!dryRun && legacy.length) {
    await prisma.endorsement.deleteMany({ where: { id: { in: legacy.map(e => e.id) } } })
  }
}

main().finally(() => prisma.$disconnect())

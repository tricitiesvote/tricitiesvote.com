/**
 * Candidate engagements from a reviewed CSV.
 *
 * An engagement is any public event or resource where a candidate answered
 * questions for voters: forums, debates, interviews, questionnaires, outside
 * voter guides. Events still to come are recorded the same way — the date says
 * whether one has happened yet.
 *
 * Rows sharing a title and url become one Engagement with its participants.
 * A row carrying a candidateLink makes the whole engagement PER_CANDIDATE, so
 * each candidate links to their own interview instead of a shared recording.
 *
 * CSV columns: title,organization,kind,date,status,url,candidateLink,candidates,confidence,notes
 *   date          YYYY-MM-DD, or a full ISO timestamp when the hour matters
 *   candidates    pipe-separated, spelled as the database spells them
 *   confidence    high | medium — only "high" loads unless --include-medium
 *   participated  optional; "no" for a candidate who was invited and did not
 *                 take part, which the guide shows as a missed engagement
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json \
 *     scripts/import/engagements-load.ts <year> [--dry-run] [--include-medium] [--file <path>]
 */
import { PrismaClient, EngagementLinkType } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const DEFAULT_CSV = path.join(__dirname, 'engagements-2026.csv')

interface Row {
  title: string
  organization: string
  kind: string
  date: string
  status: string
  url: string
  candidateLink: string
  candidates: string
  confidence: string
  notes: string
  participated: string
}

function parseCsv(text: string): Row[] {
  const rows: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
      continue
    }
    if (c === '"') inQuotes = true
    else if (c === ',') { record.push(field); field = '' }
    else if (c === '\n') { record.push(field); rows.push(record); record = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || record.length) { record.push(field); rows.push(record) }

  const cleaned = rows.filter(r => r.some(cell => cell.trim() !== ''))
  const header = cleaned.shift()
  if (!header) return []
  const at = (name: string) => header.findIndex(h => h.trim() === name)
  const cols = {
    title: at('title'), organization: at('organization'), kind: at('kind'),
    date: at('date'), status: at('status'), url: at('url'),
    candidateLink: at('candidateLink'), candidates: at('candidates'),
    confidence: at('confidence'), notes: at('notes'),
    participated: at('participated'),
  }
  if (cols.title === -1 || cols.candidates === -1) {
    throw new Error('CSV needs at least "title" and "candidates" columns')
  }

  return cleaned.map(r => {
    const get = (i: number) => (i === -1 ? '' : (r[i] ?? '').trim())
    return {
      title: get(cols.title),
      organization: get(cols.organization),
      kind: get(cols.kind),
      date: get(cols.date),
      status: get(cols.status),
      url: get(cols.url),
      candidateLink: get(cols.candidateLink),
      candidates: get(cols.candidates),
      confidence: get(cols.confidence).toLowerCase(),
      notes: get(cols.notes),
      participated: get(cols.participated).toLowerCase(),
    }
  })
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function parseDate(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const includeMedium = args.includes('--include-medium')
  const fileArg = args.indexOf('--file')
  const csvPath = fileArg !== -1 ? args[fileArg + 1] : DEFAULT_CSV
  const year = Number(args.find(a => /^\d{4}$/.test(a)))

  if (!year) {
    console.error('Pass an election year, e.g. `... engagements-load.ts 2026`')
    process.exit(1)
  }

  const accepted = new Set(includeMedium ? ['high', 'medium'] : ['high'])
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))

  // One engagement per title + url; rows are its participants
  const groups = new Map<string, Row[]>()
  let skipped = 0
  for (const row of rows) {
    if (!row.title || !row.candidates) { skipped++; continue }
    if (row.confidence && !accepted.has(row.confidence)) { skipped++; continue }
    const key = `${row.title}::${row.url}`
    const group = groups.get(key)
    if (group) group.push(row)
    else groups.set(key, [row])
  }

  let created = 0
  let updated = 0
  let linked = 0
  let alreadyLinked = 0
  const unmatched: string[] = []

  for (const group of groups.values()) {
    const first = group[0]
    const date = parseDate(first.date)
    const slug = slugify(`${first.title}${date ? `-${first.date.slice(0, 10)}` : ''}`)
    const perCandidate = group.some(r => r.candidateLink)
    const notes = [first.organization, first.notes].filter(Boolean).join(' — ') || null

    const existing = await prisma.engagement.findUnique({ where: { slug } })

    console.log(
      `\n${first.title}${date ? ` (${first.date.slice(0, 10)})` : ''} [${slug}]` +
        `${existing ? ' — exists' : ' — new'}`
    )

    let engagementId = existing?.id ?? ''
    if (!dryRun) {
      const engagement = await prisma.engagement.upsert({
        where: { slug },
        create: {
          slug,
          title: first.title,
          date,
          linkType: perCandidate ? EngagementLinkType.PER_CANDIDATE : EngagementLinkType.SHARED,
          primaryLink: first.url || null,
          notes,
        },
        update: {
          title: first.title,
          date,
          linkType: perCandidate ? EngagementLinkType.PER_CANDIDATE : EngagementLinkType.SHARED,
          primaryLink: first.url || null,
          notes,
        },
      })
      engagementId = engagement.id
    }
    existing ? updated++ : created++

    for (const row of group) {
      for (const name of row.candidates.split('|').map(n => n.trim()).filter(Boolean)) {
        const candidate = await prisma.candidate.findFirst({
          where: { electionYear: year, name: { equals: name, mode: 'insensitive' } },
          select: { id: true, name: true },
        })

        if (!candidate) {
          unmatched.push(name)
          console.log(`  ? no ${year} candidate named "${name}"`)
          continue
        }

        // Absent means they took part; "no" records an invitation they did not answer
        const participated = !['no', 'false', '0'].includes(row.participated)

        if (dryRun) {
          console.log(
            `  ${participated ? '+' : '-'} would link ${candidate.name}` +
              `${row.candidateLink ? ` -> ${row.candidateLink}` : ''}${participated ? '' : ' (did not take part)'}`
          )
          linked++
          continue
        }

        const existingLink = await prisma.candidateEngagement.findUnique({
          where: { engagementId_candidateId: { engagementId, candidateId: candidate.id } },
        })

        await prisma.candidateEngagement.upsert({
          where: { engagementId_candidateId: { engagementId, candidateId: candidate.id } },
          create: {
            engagementId,
            candidateId: candidate.id,
            participated,
            link: row.candidateLink || null,
          },
          update: {
            participated,
            link: row.candidateLink || null,
          },
        })

        if (existingLink) {
          alreadyLinked++
        } else {
          linked++
          console.log(
            `  ${participated ? '+' : '-'} ${candidate.name}` +
              `${row.candidateLink ? ` -> ${row.candidateLink}` : ''}${participated ? '' : ' (did not take part)'}`
          )
        }
      }
    }
  }

  console.log(
    `\n${dryRun ? '[dry run] ' : ''}engagements new=${created} existing=${updated} | ` +
      `participants added=${linked} already=${alreadyLinked} | rows skipped=${skipped} | ` +
      `unmatched names=${unmatched.length}` + (unmatched.length ? `: ${[...new Set(unmatched)].join(', ')}` : '')
  )
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

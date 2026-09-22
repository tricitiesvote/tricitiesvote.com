/**
 * Vote Smart profile links for candidates.
 *
 * Vote Smart's site blocks automated requests, so the links are collected by
 * hand (or by web search) into a CSV and loaded from here rather than scraped.
 * Coverage is realistically federal, legislative and statewide judicial
 * candidates; county and city offices rarely have a Vote Smart page.
 *
 * CSV columns: name,votesmartId,url,confidence,note
 *   confidence: high | medium | none — only "high" loads unless
 *   --include-medium is passed.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json \
 *     scripts/import/votesmart-links.ts <year> [--dry-run] [--include-medium] [--file <path>]
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const DEFAULT_CSV = path.join(__dirname, 'votesmart-links.csv')

type Row = { name: string; votesmartId: string; url: string; confidence: string; note: string }

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

  const [header, ...body] = rows.filter(r => r.some(cell => cell.trim() !== ''))
  const index = (name: string) => header.findIndex(h => h.trim() === name)
  const cols = {
    name: index('name'),
    votesmartId: index('votesmartId'),
    url: index('url'),
    confidence: index('confidence'),
    note: index('note'),
  }
  if (cols.name === -1 || cols.url === -1) {
    throw new Error('CSV needs at least "name" and "url" columns')
  }

  return body.map(r => ({
    name: (r[cols.name] ?? '').trim(),
    votesmartId: (r[cols.votesmartId] ?? '').trim(),
    url: (r[cols.url] ?? '').trim(),
    confidence: (r[cols.confidence] ?? '').trim().toLowerCase(),
    note: (r[cols.note] ?? '').trim(),
  }))
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const includeMedium = args.includes('--include-medium')
  const fileArg = args.indexOf('--file')
  const csvPath = fileArg !== -1 ? args[fileArg + 1] : DEFAULT_CSV
  const year = Number(args.find(a => /^\d{4}$/.test(a)))

  if (!year) {
    console.error('Pass an election year, e.g. `... votesmart-links.ts 2026`')
    process.exit(1)
  }

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  const accepted = new Set(includeMedium ? ['high', 'medium'] : ['high'])

  let updated = 0
  let unchanged = 0
  let skipped = 0
  const unmatched: string[] = []

  for (const row of rows) {
    if (!row.url || !accepted.has(row.confidence)) {
      skipped++
      continue
    }

    const candidate = await prisma.candidate.findFirst({
      where: { electionYear: year, name: { equals: row.name, mode: 'insensitive' } },
      select: { id: true, name: true, votesmart: true },
    })

    if (!candidate) {
      unmatched.push(row.name)
      console.log(`  ? no ${year} candidate matched "${row.name}"`)
      continue
    }

    if (candidate.votesmart === row.url) {
      unchanged++
      continue
    }

    if (!dryRun) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { votesmart: row.url },
      })
    }
    updated++
    console.log(`  ${dryRun ? '+ would link' : '+ linked'} ${candidate.name} -> ${row.url}`)
  }

  console.log(
    `\n${dryRun ? '[dry run] ' : ''}linked=${updated} unchanged=${unchanged} ` +
      `skipped=${skipped} unmatched=${unmatched.length}` +
      (unmatched.length ? `: ${unmatched.join(', ')}` : '')
  )
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

#!/usr/bin/env node
import 'dotenv/config'
import { Prisma, PrismaClient } from '@prisma/client'
import { NameMatcher } from '../../lib/normalize/names'
import fs from 'fs/promises'
import path from 'path'
import { tmpdir } from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const PDF_URL = 'https://www.franklincountywa.gov/DocumentCenter/View/3963/2025-VP-Franklin-County-ENGLISH'
const TARGET_PATTERNS = [
  /City of Pasco \| Councilmember/i,
  /Pasco School District No\. 1 \|/i
]

const NAME_SKIP_LINES = new Set([
  'No photo submitted',
  'Photo not available',
  'Unopposed',
  'Write-in',
  'submitted',
  'Local',
  'Voters’',
  'Voters',
  'Pamphlet',
  'Local Voters’ Pamphlet'
])

const SECTION_SKIP_LINES = new Set([
  'No information submitted'
])

function normalizeLine(input: string): string {
  return input.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function shouldProcessHeader(header: string): boolean {
  return TARGET_PATTERNS.some(pattern => pattern.test(header))
}

function formatStatement(lines: string[]): string | null {
  const filtered = lines.filter(line => !SECTION_SKIP_LINES.has(line))
  if (!filtered.length) {
    return null
  }

  const paragraphs: string[] = []
  let buffer: string[] = []

  for (const line of filtered) {
    if (!line.trim()) {
      if (buffer.length) {
        paragraphs.push(buffer.join(' '))
        buffer = []
      }
      continue
    }
    buffer.push(line)
  }

  if (buffer.length) {
    paragraphs.push(buffer.join(' '))
  }

  return paragraphs.join('\n\n')
}

function cleanEmail(line: string): string | null {
  const match = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match ? match[0].toLowerCase() : null
}

function fixUrl(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('www.')) return `http://${trimmed}`
  return null
}

interface ParsedCandidate {
  header: string
  name: string
  statement: string | null
  email: string | null
  website: string | null
}

function parseCandidateBlock(header: string, lines: string[]): ParsedCandidate | null {
  if (!lines.length) return null

  let nameParts: string[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (line === 'Statement' || line === 'Elected Experience' || line.startsWith('(')) {
      break
    }
    if (NAME_SKIP_LINES.has(line)) {
      index += 1
      continue
    }
    nameParts.push(line)
    index += 1
  }

  const name = nameParts.join(' ').trim()
  if (!name) {
    console.warn(`⚠️  Unable to determine candidate name for header "${header}"`)
    return null
  }

  const statementIdx = lines.indexOf('Statement')
  const contactIdx = lines.indexOf('Contact')

  let statement: string | null = null
  if (statementIdx !== -1) {
    const statementLines = lines.slice(statementIdx + 1, contactIdx === -1 ? lines.length : contactIdx)
    statement = formatStatement(statementLines)
  }

  let email: string | null = null
  let website: string | null = null

  if (contactIdx !== -1) {
    const contactLines = lines.slice(contactIdx + 1).filter(line => !SECTION_SKIP_LINES.has(line))
    for (const line of contactLines) {
      if (!email) {
        email = cleanEmail(line)
      }
      if (!website) {
        website = fixUrl(line)
      }
    }
  }

  return { header, name, statement, email, website }
}

async function downloadPdf(): Promise<string> {
  console.log(`⬇️  Downloading Franklin pamphlet PDF...`)
  const response = await fetch(PDF_URL)
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'franklin-pamphlet-'))
  const pdfPath = path.join(tempDir, 'franklin-2025.pdf')
  await fs.writeFile(pdfPath, Buffer.from(arrayBuffer))
  return pdfPath
}

async function pdfToText(pdfPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('pdftotext', ['-raw', '-enc', 'UTF-8', pdfPath, '-'])
    return stdout
  } catch (error) {
    console.error('❌ Failed to run pdftotext. Ensure the poppler utilities are installed and available on PATH.')
    throw error
  }
}

function parsePamphlet(text: string): ParsedCandidate[] {
  const results: ParsedCandidate[] = []
  const lines = text.split('\n')

  let currentHeader: string | null = null
  let buffer: string[] = []

  const flush = () => {
    if (!currentHeader || buffer.length === 0) {
      buffer = []
      return
    }

    const parsed = parseCandidateBlock(currentHeader, buffer.map(normalizeLine))
    if (parsed) {
      results.push(parsed)
    }
    buffer = []
  }

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine)

    if (line && shouldProcessHeader(line)) {
      if (!currentHeader && buffer.length > 0) {
        currentHeader = line
        flush()
        continue
      }

      flush()
      currentHeader = line
      continue
    }

    if (!line || /^\d+$/.test(line) || line.startsWith('Local Voters')) {
      continue
    }

    if (line.startsWith('Candidate statements are printed')) {
      flush()
      currentHeader = null
      continue
    }

    buffer.push(rawLine)
  }

  flush()

  return results
}

function addCommonAliases(nameMatcher: NameMatcher) {
  nameMatcher.addAlias('Anthony E Sanchez', 'Tony Sanchez')
  nameMatcher.addAlias('Donald Landsman', 'LANDSMAN DONALD C')
  nameMatcher.addAlias('Roy Keck', 'KECK,ROY D.')
  nameMatcher.addAlias('Roy Keck', 'Roy D. Keck')
  nameMatcher.addAlias('Robert Harvey Perkes', 'ROBERT HARVEY PERKES')
  nameMatcher.addAlias('Gloria Tyler Baker', 'Gloria Baker')
  nameMatcher.addAlias('Nic Uhnak', 'Nic (Nicolas) Uhnak')
  nameMatcher.addAlias('Mark Anthony Figueroa', 'Mark Figueroa')
  nameMatcher.addAlias('Leo A. Perales', 'Leo Perales')
  nameMatcher.addAlias('Bryan Verhei', 'Bryan A. Verhei')
  nameMatcher.addAlias('Pete Serrano', 'Peter Serrano')
  nameMatcher.addAlias('Steve Christensen', 'Steven Christensen')
  nameMatcher.addAlias('Matt Watkins', 'Matthew Watkins')
  nameMatcher.addAlias('Hans-Joachim Engelke', 'H.J. Engelke')
  nameMatcher.addAlias('Hans-Joachim Engelke', 'Hans Engelke')
}

async function updateCandidates(prisma: PrismaClient, records: ParsedCandidate[]) {
  const candidates = await prisma.candidate.findMany({
    where: { electionYear: 2025 },
    select: {
      id: true,
      name: true,
      email: true,
      website: true,
      statement: true,
      emailWiki: true,
      websiteWiki: true,
      statementWiki: true
    }
  })

  const nameMatcher = new NameMatcher()
  const candidateMap = new Map<string, typeof candidates[number]>()

  for (const candidate of candidates) {
    nameMatcher.addKnownName(candidate.name, candidate.name)
    candidateMap.set(candidate.name, candidate)
  }

  addCommonAliases(nameMatcher)

  let updated = 0
  let unmatched: ParsedCandidate[] = []

  for (const record of records) {
    const match = nameMatcher.findMatch(record.name)
    if (match.source === 'none') {
      unmatched.push(record)
      continue
    }

    const candidate = candidateMap.get(match.normalizedName)
    if (!candidate) {
      unmatched.push(record)
      continue
    }

    const data: Prisma.CandidateUpdateInput = {}
    if (
      record.email &&
      !candidate.emailWiki &&
      record.email !== candidate.email
    ) {
      data.email = record.email
    }
    if (
      record.website &&
      !candidate.websiteWiki &&
      record.website !== candidate.website
    ) {
      data.website = record.website
    }
    if (
      record.statement &&
      !candidate.statementWiki &&
      record.statement !== candidate.statement
    ) {
      data.statement = record.statement
    }

    if (Object.keys(data).length === 0) {
      continue
    }

    await prisma.candidate.update({
      where: { id: candidate.id },
      data
    })
    updated += 1
    console.log(`  ✓ Updated ${candidate.name} (${record.header})`)
  }

  if (unmatched.length) {
    console.warn('\n⚠️  Unmatched candidates:')
    for (const record of unmatched) {
      console.warn(`   - ${record.name} (${record.header})`)
    }
  }

  console.log(`\n✅ Franklin pamphlet import complete. Updated ${updated} candidates.`)
}

async function main() {
  const prisma = new PrismaClient()
  let tempDir: string | null = null

  try {
    const pdfPath = await downloadPdf()
    tempDir = path.dirname(pdfPath)
    const text = await pdfToText(pdfPath)
    const records = parsePamphlet(text)

    console.log(`Found ${records.length} candidate entries in targeted Franklin races.`)
    await updateCandidates(prisma, records)
  } finally {
    await prisma.$disconnect()
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}

main().catch(error => {
  console.error('❌ Franklin pamphlet import failed:', error)
  process.exit(1)
})

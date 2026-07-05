import { PrismaClient, EndorsementType, ForAgainst } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { CURRENT_ELECTION_YEAR } from '../../lib/constants'

const prisma = new PrismaClient()

interface LetterEndorsementRow {
  candidateName: string
  letterWriter: string
  position: 'FOR' | 'AGAINST' | 'REVIEW' | 'IGNORE'
  officeType: string
  excerpt: string
  url: string
}

const YES_COMMITTEE_NAME = 'Yes to Districts'
const NO_COMMITTEE_NAME = 'No to Districts'

function normalizeCandidateName({
  candidateName,
  position,
  officeType
}: {
  candidateName: string
  position: 'FOR' | 'AGAINST'
  officeType: string
}) {
  const trimmedName = candidateName.trim()
  const office = (officeType || '').toLowerCase()
  const isBallotMeasure = office === 'ballot measure' || office === 'ballot_measure'
  const looksLikeMeasure = /richland|charter|district/.test(trimmedName.toLowerCase())
  if (isBallotMeasure || looksLikeMeasure) {
    return position === 'FOR' ? YES_COMMITTEE_NAME : NO_COMMITTEE_NAME
  }
  return trimmedName
}

async function importLetterEndorsements() {
  console.log('📬 Importing letter endorsements...\n')

  const csvPath = path.join(__dirname, 'letter-endorsements.csv')

  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found at', csvPath)
    console.log('Run `npm run import:letters` first to generate the CSV')
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n').slice(1) // Skip header

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const line of lines) {
    if (!line.trim()) continue

    // Parse CSV line - handle quoted fields with commas
    const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)
    if (!matches || matches.length < 6) {
      console.log(`⚠️  Skipping malformed line: ${line}`)
      continue
    }

    const fields = matches.map(field =>
      field.replace(/^,?"?|"?$/g, '').replace(/""/g, '"')
    )

    const [rawCandidateName, letterWriter, position, officeType, excerpt, url] = fields
    const trimmedCandidateName = rawCandidateName.trim()
    const trimmedLetterWriter = letterWriter.trim()
    const normalizedPosition = position.trim().toUpperCase()

    // Skip REVIEW and IGNORE items
    if (normalizedPosition === 'REVIEW' || normalizedPosition === 'IGNORE') {
      console.log(`⏭️  Skipping ${normalizedPosition}: ${trimmedCandidateName} by ${trimmedLetterWriter}`)
      skipped++
      continue
    }

    if (normalizedPosition !== 'FOR' && normalizedPosition !== 'AGAINST') {
      console.log(`⏭️  Skipping line with unrecognized position "${position}": ${trimmedCandidateName} by ${trimmedLetterWriter}`)
      skipped++
      continue
    }

    const normalizedCandidateName = normalizeCandidateName({
      candidateName: trimmedCandidateName,
      position: normalizedPosition as 'FOR' | 'AGAINST',
      officeType
    })

    try {
      // Find the candidate
      const candidate = await prisma.candidate.findFirst({
        where: {
          name: { equals: normalizedCandidateName, mode: 'insensitive' },
          electionYear: CURRENT_ELECTION_YEAR
        }
      })

      if (!candidate) {
        console.log(`❌ Candidate not found: ${normalizedCandidateName}`)
        errors++
        continue
      }

      // Check if this endorsement already exists
      const existing = await prisma.endorsement.findFirst({
        where: {
          candidateId: candidate.id,
          endorser: letterWriter,
          type: EndorsementType.LETTER,
          url: url
        }
      })

      if (existing) {
        console.log(`⏭️  Already exists: ${position} ${normalizedCandidateName} by ${letterWriter}`)
        skipped++
        continue
      }

      // Create the endorsement
      await prisma.endorsement.create({
        data: {
          candidateId: candidate.id,
          endorser: trimmedLetterWriter,
          url,
          type: EndorsementType.LETTER,
          forAgainst: normalizedPosition === 'FOR' ? ForAgainst.FOR : ForAgainst.AGAINST
        }
      })

      console.log(`✅ Imported: ${normalizedPosition} ${normalizedCandidateName} by ${trimmedLetterWriter}`)
      imported++

    } catch (error) {
      console.error(`❌ Error importing ${normalizedCandidateName}:`, error)
      errors++
    }
  }

  await prisma.$disconnect()

  console.log('\n📊 Import Summary:')
  console.log(`   ✅ Imported: ${imported}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   📊 Total: ${imported + skipped + errors}`)
}

importLetterEndorsements().catch(console.error)

import { PrismaClient, EndorsementType, ForAgainst } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface LetterEndorsementRow {
  candidateName: string
  letterWriter: string
  position: 'FOR' | 'AGAINST' | 'REVIEW' | 'IGNORE'
  officeType: string
  excerpt: string
  url: string
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

    const [candidateName, letterWriter, position, officeType, excerpt, url] = fields

    // Skip REVIEW and IGNORE items
    if (position === 'REVIEW' || position === 'IGNORE') {
      console.log(`⏭️  Skipping ${position}: ${candidateName} by ${letterWriter}`)
      skipped++
      continue
    }

    try {
      // Find the candidate
      const candidate = await prisma.candidate.findFirst({
        where: {
          name: { equals: candidateName, mode: 'insensitive' },
          electionYear: 2025
        }
      })

      if (!candidate) {
        console.log(`❌ Candidate not found: ${candidateName}`)
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
        console.log(`⏭️  Already exists: ${position} ${candidateName} by ${letterWriter}`)
        skipped++
        continue
      }

      // Create the endorsement
      await prisma.endorsement.create({
        data: {
          candidateId: candidate.id,
          endorser: letterWriter,
          url: url,
          type: EndorsementType.LETTER,
          forAgainst: position === 'FOR' ? ForAgainst.FOR : ForAgainst.AGAINST
        }
      })

      console.log(`✅ Imported: ${position} ${candidateName} by ${letterWriter}`)
      imported++

    } catch (error) {
      console.error(`❌ Error importing ${candidateName}:`, error)
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

import { PrismaClient, EndorsementType } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function parseCsvLine(line: string): string[] | null {
  if (!line.trim()) {
    return null
  }

  const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)
  if (!matches) {
    return null
  }

  return matches.map(field =>
    field.replace(/^,?"?|"?$/g, '').replace(/""/g, '"').trim()
  )
}

async function purgeLetterEndorsements() {
  const csvPath = path.join(__dirname, 'letter-endorsements.csv')

  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found at', csvPath)
    process.exit(1)
  }

  const raw = fs.readFileSync(csvPath, 'utf-8')
  const lines = raw.split('\n').slice(1)

  const urls = new Set<string>()

  for (const line of lines) {
    const fields = parseCsvLine(line)
    if (!fields || fields.length < 6) {
      continue
    }

    const url = fields[5]
    if (url) {
      urls.add(url)
    }
  }

  if (urls.size === 0) {
    console.log('ℹ️  No URLs found in CSV; nothing to purge.')
    return
  }

  console.log(`🔄 Removing existing letter endorsements for ${urls.size} URLs...`)

  const result = await prisma.endorsement.deleteMany({
    where: {
      type: EndorsementType.LETTER,
      url: {
        in: Array.from(urls)
      }
    }
  })

  console.log(`✅ Removed ${result.count} existing letter endorsements.`)
}

purgeLetterEndorsements()
  .catch(err => {
    console.error('❌ Failed to purge letter endorsements:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

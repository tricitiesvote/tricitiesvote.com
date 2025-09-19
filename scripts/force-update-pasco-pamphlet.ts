import { PrismaClient } from '@prisma/client'
// @ts-ignore
import * as foldToAscii from 'fold-to-ascii'
import * as fs from 'fs/promises'
import * as path from 'path'
import TurndownService from 'turndown'

const prisma = new PrismaClient()
const turndownService = new TurndownService()

const ELECTION_ID = '894'

// Pasco-specific race mappings
const PASCO_RACE_MAP: Record<string, { office: string, region: string }> = {
  // Pasco City Council races
  "166961": { office: "City Council District 1", region: "Pasco" },
  "166962": { office: "City Council District 3", region: "Pasco" },
  "166963": { office: "City Council District 4", region: "Pasco" },
  "166964": { office: "City Council District 6", region: "Pasco" },

  // Pasco School Board races
  "166942": { office: "School Board Director District 3", region: "Pasco" },
  "166943": { office: "School Board Director District 4", region: "Pasco" },
  "166944": { office: "School Board Director District 5", region: "Pasco" },

  // Port of Pasco races
  "166934": { office: "Port of Pasco Commissioner District 2", region: "Pasco" },
  "166935": { office: "Port of Pasco Commissioner District 3", region: "Pasco" },
}

async function updateCandidate(candidateName: string, pamphletData: any) {
  // Handle special case names
  let cleanName = candidateName.replace(/\s+/g, ' ').trim()
  if (cleanName === 'Nic (Nicolas) Uhnak') {
    cleanName = 'Nic Uhnak'
  }

  // Find the candidate
  const candidate = await prisma.candidate.findFirst({
    where: {
      electionYear: 2025,
      name: { equals: cleanName, mode: 'insensitive' },
      office: {
        region: { name: 'Pasco' }
      }
    }
  })

  if (!candidate) {
    console.log(`   ❌ ${candidateName} - NOT FOUND IN DATABASE`)
    return
  }

  console.log(`\n📝 Updating ${candidate.name}...`)

  const updateData: any = {}

  // Update email
  if (pamphletData.statement.OrgEmail) {
    updateData.email = pamphletData.statement.OrgEmail
    console.log(`   Email: ${updateData.email}`)
  }

  // Update website
  if (pamphletData.statement.OrgWebsite) {
    updateData.website = pamphletData.statement.OrgWebsite.startsWith('http')
      ? pamphletData.statement.OrgWebsite
      : `http://${pamphletData.statement.OrgWebsite}`
    console.log(`   Website: ${updateData.website}`)
  }

  // Save photo
  if (pamphletData.statement.Photo) {
    const imageDir = path.join(process.cwd(), 'public/images/candidates/2025')
    await fs.mkdir(imageDir, { recursive: true })

    const filename = candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const photoPath = path.join(imageDir, `${filename}-original.png`)
    const photoBuffer = Buffer.from(pamphletData.statement.Photo, 'base64')
    await fs.writeFile(photoPath, photoBuffer)

    updateData.image = `/images/candidates/2025/${filename}-original.png`
    console.log(`   Photo saved: ${filename}-original.png`)
  }

  // Update statement
  if (pamphletData.statement.CandidateStatementText || pamphletData.statement.Statement) {
    const statementHtml = pamphletData.statement.CandidateStatementText || pamphletData.statement.Statement
    if (statementHtml) {
      updateData.statement = turndownService.turndown(statementHtml)
      console.log(`   Statement saved (${updateData.statement.length} chars)`)
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: updateData
    })
    console.log(`   ✅ Updated successfully`)
  } else {
    console.log(`   ℹ️  No data to update`)
  }
}

async function main() {
  console.log('🚀 Force-updating Pasco pamphlet data...\n')

  for (const [raceId, raceInfo] of Object.entries(PASCO_RACE_MAP)) {
    console.log(`\n📋 ${raceInfo.office}:`)

    const url = `https://voter.votewa.gov/elections/candidate.ashx?e=${ELECTION_ID}&r=${raceId}&la=&c=`
    const response = await fetch(url)

    if (!response.ok) {
      console.log(`   ❌ Failed to fetch race ${raceId}`)
      continue
    }

    const data = await response.json()

    if (data.length === 0) {
      console.log(`   ℹ️  No candidates found`)
      continue
    }

    for (const item of data) {
      if (item.statement?.BallotName) {
        const name = foldToAscii.foldReplacing(item.statement.BallotName)
        await updateCandidate(name, item)
      }
    }
  }

  console.log('\n✅ Force update complete!')
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error('❌ Error:', error)
  await prisma.$disconnect()
  process.exit(1)
})
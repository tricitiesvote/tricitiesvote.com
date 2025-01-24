import { PrismaClient } from '@prisma/client'
import { WAStateClient } from '../lib/wa-state'
import { PamphletClient } from '../lib/wa-state/pamphlet'
import { NameMatcher } from '../lib/normalize/names'
import * as dotenv from 'dotenv'
import * as namesConfig from '../load-config-names.json'

dotenv.config()

const prisma = new PrismaClient()
const nameMatcher = new NameMatcher()

// Load name mappings from config
namesConfig.forEach(entry => {
  nameMatcher.addKnownName(entry.formattedName, entry.formattedName)
  entry.altNames?.forEach(altName => {
    nameMatcher.addAlias(entry.formattedName, altName)
  })
})

async function main() {
  try {
    // Initialize clients
    const pdc = new WAStateClient({
      apiId: process.env.SOCRATA_API_ID!,
      apiSecret: process.env.SOCRATA_API_SECRET!
    })

    const pamphlet = new PamphletClient({
      electionId: '883', // 2023 General
      raceIds: [
        "125361", "125362", "125363", "125364", 
        "125218", "125217", "125219", "125225",
        // ... add all race IDs
      ],
      imageDir: 'static/images/candidates',
      publicImagePath: '/images/candidates'
    }, nameMatcher, prisma)

    // First get PDC data
    console.log('Fetching PDC contributions...')
    for await (const batch of pdc.getContributions({ election_year: '2023' })) {
      for (const contribution of batch) {
        // Store contribution in database
        await prisma.contribution.create({
          data: {
            amount: parseFloat(contribution.contribution_amount),
            date: new Date(contribution.contribution_date),
            donor: contribution.contributor_name,
            city: contribution.contributor_city,
            state: contribution.contributor_state,
            zip: contribution.contributor_zip,
            employer: contribution.contributor_employer,
            occupation: contribution.contributor_occupation,
            description: contribution.description,
            candidate: {
              connect: {
                stateId: contribution.filer_id
              }
            }
          }
        })
      }
    }

    // Then get pamphlet data
    console.log('Fetching voter pamphlet data...')
    await pamphlet.fetchCandidateData()

    console.log('Import completed successfully')
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  }
}

main()
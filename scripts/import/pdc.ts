// scripts/import/pdc.ts
import { PrismaClient, RegionType, OfficeType } from '@prisma/client'
import * as soda from 'soda-js'
import _ from 'lodash'

const prisma = new PrismaClient()

interface PDCCandidate {
  filer_id: string
  filer_name: string
  office: string
  legislative_district: string
  position: string
  jurisdiction_county: string
  jurisdiction: string
  party: string
  election_year: string
}

async function importPDCData(year: number) {
  const consumer = new soda.Consumer('data.wa.gov')
  
  const query = consumer.query()
    .withDataset('kv7h-kjye') // campaign finance reports
    .limit(10000)
    .where(`
      election_year = '${year}' AND
      type = 'Candidate' AND
      (
        jurisdiction = 'CITY OF RICHLAND' OR
        jurisdiction = 'CITY OF KENNEWICK' OR
        jurisdiction = 'CITY OF WEST RICHLAND' OR
        jurisdiction = 'CITY OF PASCO' OR
        jurisdiction_county = 'BENTON' OR 
        jurisdiction_county = 'FRANKLIN' OR 
        legislative_district = '16' OR 
        legislative_district = '08' OR 
        legislative_district = '09' OR
        legislative_district = '8' OR 
        legislative_district = '9' 
      )
    `)

  return new Promise<PDCCandidate[]>((resolve, reject) => {
    query.getRows()
      .on('success', resolve)
      .on('error', reject)
  })
}

async function mapCandidateToDatabase(pdcCandidate: PDCCandidate) {
  // First ensure we have the right office
  const office = await getOrCreateOffice(pdcCandidate)
  
  // Get or create the election
  const election = await prisma.election.findFirst({
    where: {
      year: parseInt(pdcCandidate.election_year),
      type: 'GENERAL'
    }
  })
  
  if (!election) {
    throw new Error(`No election found for year ${pdcCandidate.election_year}`)
  }
  
  // Get or create the race for this office in this election
  const race = await prisma.race.findFirst({
    where: {
      electionId: election.id,
      officeId: office.id
    }
  }) || await prisma.race.create({
    data: {
      electionId: election.id,
      officeId: office.id,
      termLength: office.termLength
    }
  })
  
  // Create or update the candidate
  const candidate = await prisma.candidate.upsert({
    where: {
      stateId: pdcCandidate.filer_id
    },
    create: {
      name: pdcCandidate.filer_name,
      stateId: pdcCandidate.filer_id,
      races: {
        create: {
          raceId: race.id,
          party: pdcCandidate.party
        }
      }
    },
    update: {
      name: pdcCandidate.filer_name,
      races: {
        create: {
          raceId: race.id,
          party: pdcCandidate.party
        }
      }
    }
  })
  
  return candidate
}

async function getOrCreateOffice(pdcCandidate: PDCCandidate) {
  // Map PDC office data to our schema
  const officeData = mapPDCOfficeData(pdcCandidate)
  
  return prisma.office.upsert({
    where: {
      regionId_title: {
        regionId: officeData.regionId,
        title: officeData.title
      }
    },
    create: officeData,
    update: officeData
  })
}

function mapPDCOfficeData(pdcCandidate: PDCCandidate) {
  // This would contain the logic to map PDC office descriptions
  // to our office/region structure
  // Would need to handle all the different types of offices
  // Return type would match our Office schema
}

async function main() {
  const year = 2023 // or get from args
  
  try {
    const pdcData = await importPDCData(year)
    
    for (const candidate of pdcData) {
      await mapCandidateToDatabase(candidate)
      console.log(`Processed ${candidate.filer_name}`)
    }
    
    console.log('Import completed successfully')
  } catch (error) {
    console.error('Import failed:', error)
  }
}

main()
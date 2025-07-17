import { PrismaClient, OfficeType } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import glob from 'glob-promise'
import { readJsonFile } from './utils'

const prisma = new PrismaClient()

interface CandidateData {
  name: string
  office: string
  electionyear: string
  uuid?: string
  slug?: string
}

interface OfficeMapping {
  office: string
  type: OfficeType
  region: string
  jobTitle: string
  position?: number
}

function mapOfficeTypeString(office: string): OfficeType {
  const typeMap: Record<string, OfficeType> = {
    'City Council': 'CITY_COUNCIL',
    'School Board': 'SCHOOL_BOARD',
    'Port Commissioner': 'PORT_COMMISSIONER',
    'County Commissioner': 'COUNTY_COMMISSIONER',
    'State Representative': 'STATE_REPRESENTATIVE',
    'State Senator': 'STATE_SENATOR',
    'Superior Court Judge': 'SUPERIOR_COURT_JUDGE',
    'U.S. House': 'US_HOUSE',
    'U.S. Senate': 'US_SENATE',
    'County Prosecutor': 'PROSECUTOR',
    'County Sheriff': 'SHERIFF',
    'Sheriff': 'SHERIFF',
    'Prosecutor': 'PROSECUTOR',
    'Mayor': 'MAYOR'
  }
  
  return typeMap[office] || 'CITY_COUNCIL' // Default fallback
}

function inferRegionFromOffice(office: string, candidateName?: string): string {
  // Handle specific legislative districts
  if (office.includes('16th District') || office.includes('District 16')) {
    return 'Franklin County'  // 16th District serves Franklin County
  }
  if (office.includes('8th District') || office.includes('District 8') || office.includes('9th District')) {
    return 'Benton County'   // 8th/9th Districts serve Benton County
  }
  
  // For county-level offices with specific counties
  if (office.includes('Franklin County') || office.includes('Franklin Commissioner')) {
    return 'Franklin County'
  }
  if (office.includes('Benton County') || office.includes('Benton Commissioner')) {
    return 'Benton County'
  }
  
  // Generic county offices default to Benton County
  if (office.includes('County') || office === 'County Commissioner' || office === 'County Prosecutor' || office === 'County Sheriff') {
    return 'Benton County'
  }
  
  // For state-level offices, use a state-wide region
  if (office.includes('State') || office === 'State Representative' || office === 'State Senator') {
    return 'Washington State'
  }
  
  // For federal offices
  if (office.includes('U.S.') || office === 'U.S. House' || office === 'U.S. Senate') {
    return 'United States'
  }
  
  // For superior court judges (bi-county)
  if (office === 'Superior Court Judge' || office.includes('Superior Court')) {
    return 'Benton-Franklin Counties'
  }
  
  // Local city offices by city
  if (office.includes('Kennewick')) return 'Kennewick'
  if (office.includes('Pasco')) return 'Pasco'  
  if (office.includes('Richland')) return 'Richland'
  if (office.includes('West Richland')) return 'West Richland'
  
  // Default to Tri-Cities region for local offices
  return 'Tri-Cities'
}

function createOfficeTitle(office: string, position?: number): string {
  if (position) {
    return `${office} Pos ${position}`
  }
  return office
}

function getJobTitle(office: string): string {
  const jobTitleMap: Record<string, string> = {
    'City Council': 'Council member',
    'School Board': 'Board member',
    'Port Commissioner': 'Commissioner',
    'County Commissioner': 'Commissioner',
    'State Representative': 'Representative',
    'State Senator': 'Senator',
    'Superior Court Judge': 'Judge',
    'U.S. House': 'Representative',
    'U.S. Senate': 'Senator',
    'County Prosecutor': 'Prosecutor',
    'County Sheriff': 'Sheriff',
    'Sheriff': 'Sheriff',
    'Prosecutor': 'Prosecutor',
    'Mayor': 'Mayor'
  }
  
  return jobTitleMap[office] || 'Official'
}

function getRegionCode(name: string): string {
  const codeMap: Record<string, string> = {
    'Richland': 'RCH',
    'Kennewick': 'KEN',
    'Pasco': 'PAS',
    'West Richland': 'WR',
    'Benton County': 'BC',
    'Franklin County': 'FC',
    'Washington State': 'WA',
    'United States': 'US',
    'Benton-Franklin Counties': 'BF',
    'Tri-Cities': 'TC'
  }
  return codeMap[name] || name.substring(0, 3).toUpperCase()
}

export async function migrateDynamicBase() {
  console.log('Starting dynamic base data migration...')
  
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  const years = [2020, 2021, 2022, 2023]
  const allOffices = new Set<string>()
  const regions = new Set<string>()
  
  // Scan all candidate data to find unique offices
  console.log('Scanning candidate data across all years...')
  for (const year of years) {
    try {
      if (year === 2023) {
        // 2023 data is in the current branch
        const candidateFiles = await glob('legacy/data/json/candidates/*.json')
        for (const file of candidateFiles) {
          const candidate: CandidateData = await readJsonFile(file)
          allOffices.add(candidate.office)
          regions.add(inferRegionFromOffice(candidate.office, candidate.name))
        }
      } else {
        // Switch to the year branch to get its data
        execSync(`git stash push -m "WIP: dynamic migration" 2>/dev/null || true`, { stdio: 'pipe' })
        execSync(`git checkout ${year}`, { stdio: 'pipe' })
        
        const candidateFiles = await glob('data/candidates/*.json')
        for (const file of candidateFiles) {
          const candidate: CandidateData = await readJsonFile(file)
          allOffices.add(candidate.office)
          regions.add(inferRegionFromOffice(candidate.office, candidate.name))
        }
        
        // Return to original branch
        execSync(`git checkout ${currentBranch}`, { stdio: 'pipe' })
        execSync(`git stash pop 2>/dev/null || true`, { stdio: 'pipe' })
      }
    } catch (error) {
      console.warn(`Failed to scan ${year} data:`, error)
    }
  }
  
  console.log(`Found ${allOffices.size} unique offices and ${regions.size} regions`)
  
  // Create regions
  console.log('Creating regions...')
  const regionMap = new Map<string, string>()
  
  for (const regionName of regions) {
    let existingRegion = await prisma.region.findFirst({
      where: { name: regionName }
    })
    
    if (!existingRegion) {
      existingRegion = await prisma.region.create({
        data: {
          name: regionName,
          code: getRegionCode(regionName)
        }
      })
    }
    
    regionMap.set(regionName, existingRegion.id)
  }
  
  // Create offices
  console.log('Creating offices...')
  for (const officeName of allOffices) {
    const region = inferRegionFromOffice(officeName)
    const regionId = regionMap.get(region)
    
    if (!regionId) {
      console.warn(`Region not found: ${region}`)
      continue
    }
    
    const officeType = mapOfficeTypeString(officeName)
    const title = createOfficeTitle(officeName)
    const jobTitle = getJobTitle(officeName)
    
    // Check if office already exists
    const existingOffice = await prisma.office.findFirst({
      where: {
        regionId,
        title
      }
    })
    
    if (!existingOffice) {
      await prisma.office.create({
        data: {
          title,
          type: officeType,
          regionId,
          jobTitle,
          position: null
        }
      })
      console.log(`Created office: ${title} (${officeType}) in ${region}`)
    }
  }
  
  console.log('Dynamic base data migration completed')
}

export async function runDynamicMigration() {
  try {
    await migrateDynamicBase()
  } catch (error) {
    console.error('Dynamic migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  runDynamicMigration()
}
import { PrismaClient, OfficeType } from '@prisma/client'
import * as fs from 'fs/promises'
import * as path from 'path'
import glob from 'glob-promise'
import { readJsonFile } from './utils'

const prisma = new PrismaClient()

interface LegacyOffice {
  uuid: string
  office: string // The type (e.g. "City Council")
  job: string // The job title (e.g. "Council member")
  position?: number
  region: string
  title: string // The full title (e.g. "Richland City Council Pos 1")
}

function mapOfficeType(type: string): OfficeType {
  const typeMap: Record<string, OfficeType> = {
    'City Council': 'CITY_COUNCIL',
    'School Board': 'SCHOOL_BOARD',
    'Port Commissioner': 'PORT_COMMISSIONER',
    'County Commissioner': 'COUNTY_COMMISSIONER',
    'WA Legislator (Senate)': 'STATE_SENATOR',
    'WA Legislator (House)': 'STATE_REPRESENTATIVE',
    'Superior Court Judge': 'SUPERIOR_COURT_JUDGE',
    'U.S. House': 'US_HOUSE',
    'U.S. Senate': 'US_SENATE',
    'Mayor': 'MAYOR',
    'Sheriff': 'SHERIFF',
    'Prosecutor': 'PROSECUTOR'
  }
  
  const mappedType = typeMap[type]
  if (!mappedType) {
    throw new Error(`Unknown office type: ${type}`)
  }
  return mappedType
}

function getRegionCode(name: string): string {
  const codeMap: Record<string, string> = {
    'Richland': 'RCH',
    'Kennewick': 'KEN',
    'Pasco': 'PAS',
    'West Richland': 'WR',
    'Benton County': 'BC',
    'Franklin County': 'FC',
    'Port of Benton': 'POB',
    'Port of Kennewick': 'POK',
    'Port of Pasco': 'POP'
  }
  return codeMap[name] || name.substring(0, 3).toUpperCase()
}

export async function migrateBaseData() {
  console.log('Migrating base data (regions and offices)...')
  
  // Get all office files
  const officeFiles = await glob('legacy/data/json/offices/*.json')
  const offices = new Map<string, LegacyOffice>()
  const regions = new Set<string>()
  
  // Read all office files and collect unique regions
  for (const file of officeFiles) {
    if (path.basename(file) === '.gitkeep') continue
    
    const office: LegacyOffice = await readJsonFile(file)
    const key = path.basename(file, '.json')
    offices.set(key, office)
    regions.add(office.region)
  }
  
  // Migrate regions
  console.log('Migrating regions...')
  const regionMap = new Map<string, string>() // Maps region name to ID
  
  for (const regionName of regions) {
    // First try to find existing region
    let existingRegion = await prisma.region.findFirst({
      where: { name: regionName }
    })
    
    if (!existingRegion) {
      // Create new region if it doesn't exist
      existingRegion = await prisma.region.create({
        data: {
          name: regionName,
          code: getRegionCode(regionName)
        }
      })
    } else {
      // Update existing region
      existingRegion = await prisma.region.update({
        where: { id: existingRegion.id },
        data: {
          code: getRegionCode(regionName)
        }
      })
    }
    
    regionMap.set(regionName, existingRegion.id)
  }
  
  // Migrate offices
  console.log('Migrating offices...')
  for (const [key, office] of offices) {
    const regionId = regionMap.get(office.region)
    if (!regionId) {
      throw new Error(`Region not found: ${office.region}`)
    }
    
    const officeType = mapOfficeType(office.office)
    
    // First try to find existing office
    let existingOffice = await prisma.office.findFirst({
      where: {
        regionId,
        title: office.title
      }
    })
    
    if (!existingOffice) {
      // Create new office if it doesn't exist
      await prisma.office.create({
        data: {
          title: office.title,
          type: officeType,
          regionId,
          jobTitle: office.job,
          position: office.position || null
        }
      })
    } else {
      // Update existing office
      await prisma.office.update({
        where: { id: existingOffice.id },
        data: {
          type: officeType,
          jobTitle: office.job,
          position: office.position || null
        }
      })
    }
  }
  
  console.log('Base data migration completed')
} 
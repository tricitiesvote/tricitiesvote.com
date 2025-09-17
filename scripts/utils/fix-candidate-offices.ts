#!/usr/bin/env npx tsx
/**
 * Utility to fix candidate office assignments
 * 
 * Usage:
 *   npx tsx scripts/utils/fix-candidate-offices.ts [year]
 * 
 * This script helps reassign candidates to their correct offices when
 * they've been imported with incorrect or generic office assignments.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CandidateOfficeMapping {
  candidates: string[]
  office: string
  region: string
  officeType?: string
  jobTitle?: string
}

// Default mappings for 2025 - can be extended for other years
const CANDIDATE_OFFICE_MAPPINGS: Record<number, CandidateOfficeMapping[]> = {
  2025: [
    // Richland City Council Position 7
    { candidates: ["Joshua Short", "Tony Sanchez", "Colin Michael", "Ryan Whitten"], 
      office: "City Council Position 7", region: "Richland" },
    
    // Kennewick School Board
    { candidates: ["Mike Luzzo", "Robert Franklin", "Micah Valentine"], 
      office: "School Board Director No. 2", region: "Kennewick",
      officeType: "SCHOOL_BOARD", jobTitle: "School Board Director" },
    
    // Kennewick City Council Ward 1
    { candidates: ["Austin Miller", "Tina Gregory", "Jason McShane"], 
      office: "City Council Ward District #1", region: "Kennewick" },
    
    // Kennewick City Council Ward 3
    { candidates: ["Douglas Perez", "Warren Hughs", "John Trumbo"], 
      office: "City Council Ward District #3", region: "Kennewick" },
    
    // Kennewick City Council Position 4
    { candidates: ["Gloria Tyler Baker", "Danielle Schuster", "Brad Klippert"], 
      office: "City Council Position 4", region: "Kennewick" },
    
    // Richland City Council Position 3
    { candidates: ["Robert Walko", "Pat Holten", "Sandra Kent"], 
      office: "City Council Position 3", region: "Richland" },
    
    // Richland City Council Position 6
    { candidates: ["Joshua Arnold", "Kyle Saltz", "Kurt H Maier"], 
      office: "City Council Position 6", region: "Richland" },
    
    // Richland City Council Position 4
    { candidates: ["Jordan Lee", "John Maier", "Donald Landsman"], 
      office: "City Council Position 4", region: "Richland" },
  ]
}

async function fixCandidateOffices(year: number, mappings?: CandidateOfficeMapping[]) {
  console.log(`🔧 Fixing candidate office assignments for ${year}...\n`)
  
  const officeMappings = mappings || CANDIDATE_OFFICE_MAPPINGS[year]
  
  if (!officeMappings) {
    console.log(`❌ No mappings defined for year ${year}`)
    console.log('   Please provide mappings as second argument or add to CANDIDATE_OFFICE_MAPPINGS')
    return
  }
  
  // Check for candidates in generic offices
  const genericOffices = await prisma.office.findMany({
    where: { 
      OR: [
        { title: "Unknown Office" },
        { title: { contains: "Unknown" } }
      ]
    },
    include: { 
      candidates: { where: { electionYear: year } } 
    }
  })
  
  for (const office of genericOffices) {
    if (office.candidates.length > 0) {
      console.log(`Found ${office.candidates.length} candidates in "${office.title}"\n`)
    }
  }
  
  let totalUpdated = 0
  
  for (const mapping of officeMappings) {
    console.log(`\n📋 ${mapping.office} (${mapping.region}):`)
    
    // Find or create the correct office
    const region = await prisma.region.findFirst({
      where: { name: mapping.region }
    })
    
    if (!region) {
      console.
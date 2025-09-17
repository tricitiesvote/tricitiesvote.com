#!/usr/bin/env npx tsx
/**
 * Finds potential duplicate candidates based on name similarity
 * 
 * Usage:
 *   npx tsx scripts/utils/find-duplicates.ts [year]
 * 
 * This script uses various similarity checks to identify candidates
 * that might be duplicates with slightly different names.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const year = parseInt(process.argv[2] || new Date().getFullYear().toString())

interface CandidateWithOffice {
  id: string
  name: string
  electionYear: number
  office: {
    title: string
    region: {
      name: string
    }
  }
}

function calculateSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()
  
  // Exact match
  if (n1 === n2) return 100
  
  // Check if one contains the other
  if (n1.includes(n2) || n2.includes(n1)) return 90
  
  // Check last name match
  const parts1 = n1.split(' ')
  const parts2 = n2.split(' ')
  const last1 = parts1[parts1.length - 1]
  const last2 = parts2[parts2.length - 1]
  
  if (last1 === last2 && last1.length > 2) {
    // Same last name, check first name similarity
    const first1 = parts1[0]
    const first2 = parts2[0]
    
    if (first1 === first2) return 95
    if (first1.startsWith(first2) || first2.startsWith(first1)) return 85
    return 75 // Same last name only
  }
  
  // Levenshtein distance
  const distance = levenshteinDistance(n1, n2)
  const maxLen = Math.max(n1.length, n2.length)
  const similarity = (1 - distance / maxLen) * 100
  
  return similarity
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

async function findDuplicates() {
  console.log(`🔍 Finding potential duplicate candidates for ${year}...\n`)
  
  const candidates = await prisma.candidate.findMany({
    where: { electionYear: year },
    include: {
      office: {
        include: { region: true }
      }
    },
    orderBy: { name: 'asc' }
  })
  
  console.log(`Found ${candidates.length} candidates to check\n`)
  
  const potentialDuplicates: Array<{
    candidate1: CandidateWithOffice
    candidate2: CandidateWithOffice
    similarity: number
  }> = []
  
  // Compare each candidate with every other candidate
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const similarity = calculateSimilarity(candidates[i].name, candidates[j].name)
      
      if (similarity > 70) {
        potentialDuplicates.push({
          candidate1: candidates[i],
          candidate2: candidates[j],
          similarity
        })
      }
    }
  }
  
  // Sort by similarity score
  potentialDuplicates.sort((a, b) => b.similarity - a.similarity)
  
  if (potentialDuplicates.length === 0) {
    console.log('✅ No potential duplicates found!')
    return
  }
  
  console.log(`⚠️  Found ${potentialDuplicates.length} potential duplicate pairs:\n`)
  
  // Group by similarity level
  const highConfidence = potentialDuplicates.filter(d => d.similarity >= 90)
  const mediumConfidence = potentialDuplicates.filter(d => d.similarity >= 80 && d.similarity < 90)
  const lowConfidence = potentialDuplicates.filter(d => d.similarity >= 70 && d.similarity < 80)
  
  if (highConfidence.length > 0) {
    console.log('🔴 HIGH CONFIDENCE DUPLICATES (90%+):')
    highConfidence.forEach(dup => {
      console.log(`\n   ${dup.similarity.toFixed(1)}% match:`)
      console.log(`   - "${dup.candidate1.name}" (${dup.candidate1.office.title}, ${dup.candidate1.office.region.name})`)
      console.log(`   - "${dup.candidate2.name}" (${dup.candidate2.office.title}, ${dup.candidate2.office.region.name})`)
    })
  }
  
  if (mediumConfidence.length > 0) {
    console.log('\n🟡 MEDIUM CONFIDENCE DUPLICATES (80-90%):')
    mediumConfidence.forEach(dup => {
      console.log(`\n   ${dup.similarity.toFixed(1)}% match:`)
      console.log(`   - "${dup.candidate1.name}" (${dup.candidate1.office.title}, ${dup.candidate1.office.region.name})`)
      console.log(`   - "${dup.candidate2.name}" (${dup.candidate2.office.title}, ${dup.candidate2.office.region.name})`)
    })
  }
  
  if (lowConfidence.length > 0 && process.argv.includes('--all')) {
    console.log('\n🟢 LOW CONFIDENCE DUPLICATES (70-80%):')
    lowConfidence.forEach(dup => {
      console.log(`\n   ${dup.similarity.toFixed(1)}% match:`)
      console.log(`   - "${dup.candidate1.name}" (${dup.candidate1.office.title}, ${dup.candidate1.office.region.name})`)
      console.log(`   - "${dup.candidate2.name}" (${dup.candidate2.office.title}, ${dup.candidate2.office.region.name})`)
    })
  } else if (lowConfidence.length > 0) {
    console.log(`\n(${lowConfidence.length} low confidence matches hidden - use --all to show)`)
  }
  
  console.log('\n💡 To merge duplicates, use the merge-candidates utility')
}

findDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
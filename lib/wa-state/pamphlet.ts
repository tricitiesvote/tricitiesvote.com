import { PrismaClient } from '@prisma/client'
import TurndownService from 'turndown'
import { NameMatcher } from '../normalize/names'
import * as foldToAscii from 'fold-to-ascii'
import path from 'path'
import fs from 'fs/promises'

interface PamphletData {
  statement: {
    BallotID: string
    BallotName: string
    OrgEmail: string
    OrgWebsite: string
    CandidateStatementText: string
    Statement?: string // For backwards compatibility
    Photo?: string
  }
  HasPhoto?: boolean
}

interface PamphletConfig {
  electionId: string
  raceIds: string[]
  imageDir: string
  publicImagePath: string
}

export class PamphletClient {
  private markdownConverter: TurndownService
  private nameMatcher: NameMatcher
  private prisma: PrismaClient
  
  constructor(
    private config: PamphletConfig,
    nameMatcher: NameMatcher,
    prisma: PrismaClient
  ) {
    this.markdownConverter = new TurndownService()
    this.nameMatcher = nameMatcher
    this.prisma = prisma
  }

  async fetchCandidateData() {
    const baseUrl = 'https://voter.votewa.gov/elections/candidate.ashx'
    
    for (const raceId of this.config.raceIds) {
      const url = `${baseUrl}?e=${this.config.electionId}&r=${raceId}&la=&c=`
      const response = await fetch(url)
      const data: PamphletData[] = await response.json()
      
      for (const item of data) {
        await this.processCandidateData(item, raceId)
      }
    }
  }

  private async processCandidateData(data: PamphletData, raceId: string) {
    if (!data.statement || !data.statement.BallotName) {
      console.warn(`Missing ballot name for race ${raceId}`)
      return
    }
    
    const rawName = foldToAscii.foldReplacing(data.statement.BallotName || '')
    const nameMatch = this.nameMatcher.findMatch(rawName)
    
    // Skip if we can't match the name
    if (nameMatch.source === 'none') {
      console.warn(`Could not match name: ${rawName}`)
      return
    }

    const normalizedName = nameMatch.normalizedName
    
    // Store the photo if present
    let imagePath = ''
    if (data.statement.Photo) {
      console.log(`  📸 Found photo for ${normalizedName} (${data.statement.Photo.length} bytes)`)
      imagePath = await this.savePhoto(data.statement.Photo, normalizedName)
    } else {
      console.log(`  ❌ No photo for ${normalizedName}`)
    }

    // Convert HTML statement to markdown
    const statementText = data.statement.CandidateStatementText || data.statement.Statement || ''
    const statementMarkdown = statementText ? this.markdownConverter.turndown(statementText) : null

    // Update or create candidate in database - we need to find by name AND year
    const candidate = await this.prisma.candidate.findFirst({
      where: { 
        name: normalizedName,
        electionYear: { in: [2025, 2024] } // Check recent years
      }
    })
    
    if (candidate) {
      const updateData = {
        email: data.statement.OrgEmail || candidate.email,
        website: this.fixUrl(data.statement.OrgWebsite) || candidate.website,
        image: imagePath || candidate.image,
        statement: statementMarkdown || candidate.statement
      }
      
      console.log(`  📝 Updating ${normalizedName}:`)
      if (data.statement.OrgEmail) console.log(`     Email: ${data.statement.OrgEmail}`)
      if (data.statement.OrgWebsite) console.log(`     Website: ${data.statement.OrgWebsite}`)
      if (imagePath) console.log(`     Image: ${imagePath}`)
      if (statementMarkdown) console.log(`     Statement: ${statementMarkdown.substring(0, 50)}...`)
      
      await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: updateData
      })
      console.log(`  ✓ Updated ${normalizedName}`)
    } else {
      console.warn(`  ⚠️  Candidate not found in database: ${normalizedName}`)
    }
  }

  private async savePhoto(base64Photo: string, candidateName: string) {
    const filename = this.slugify(candidateName)
    const photoBuffer = Buffer.from(base64Photo, 'base64')
    const imagePath = path.join(
      this.config.imageDir,
      `${filename}-original.png`
    )
    
    await fs.writeFile(imagePath, photoBuffer)
    
    return path.join(this.config.publicImagePath, `${filename}-original.png`)
  }

  private fixUrl(url?: string): string | null {
    if (!url) return null
    if (!/^(?:f|ht)tps?:\/\//.test(url)) {
      return `http://${url}`
    }
    return url
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}
import { PrismaClient } from '@prisma/client'
import TurndownService from 'turndown'
import { NameMatcher } from '../normalize/names'
import { foldReplacing } from 'fold-to-ascii'
import path from 'path'
import fs from 'fs/promises'

interface PamphletData {
  statement: {
    BallotID: string
    BallotName: string
    OrgEmail: string
    OrgWebsite: string
    Statement: string
    Photo?: string
  }
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
    const rawName = foldReplacing(data.statement.BallotName)
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
      imagePath = await this.savePhoto(data.statement.Photo, normalizedName)
    }

    // Convert HTML statement to markdown
    const statementMarkdown = this.markdownConverter.turndown(
      data.statement.Statement
    )

    // Update or create candidate in database
    await this.prisma.candidate.upsert({
      where: { name: normalizedName },
      create: {
        name: normalizedName,
        email: data.statement.OrgEmail,
        website: this.fixUrl(data.statement.OrgWebsite),
        image: imagePath,
        // Additional fields can be added here
      },
      update: {
        email: data.statement.OrgEmail,
        website: this.fixUrl(data.statement.OrgWebsite),
        image: imagePath,
        // Additional fields can be updated here
      }
    })
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
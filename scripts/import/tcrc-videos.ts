/**
 * TCRC Video Forum Participation Tracker
 *
 * Tracks which candidates participated in TCRC video forum interviews.
 * Analyzes transcripts to identify participants and creates engagement records.
 *
 * Usage:
 *   npm run import:tcrc:videos              # Dry run (CSV output only)
 *   IMPORT_MODE=db npm run import:tcrc:videos   # Write to database
 *
 * Requirements:
 *   - DATABASE_URL in environment
 *   - ANTHROPIC_API_KEY in environment
 *   - Transcript files in /transcripts directory
 */

import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import {
  EMOJI,
  getOutputMode,
  generateEngagementSlug,
  isDryRun,
  RATE_LIMITS,
  escapeCsvField,
} from './config'

const prisma = new PrismaClient()

interface VideoEngagement {
  videoId: string
  title: string
  office: string
  participants: string[]
  date?: Date
}

interface CsvRow {
  videoId: string
  title: string
  office: string
  candidate: string
  participated: boolean
}

async function trackVideoParticipation() {
  console.log(`${EMOJI.SEARCH} Starting TCRC Video Forum tracker...\n`)

  const outputMode = getOutputMode()
  console.log(outputMode.message)
  console.log()

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      `${EMOJI.ERROR} ERROR: ANTHROPIC_API_KEY environment variable not set`
    )
    console.error('Please add it to your .env file or set it in your environment')
    process.exit(1)
  }

  // Check for transcripts directory
  const fs = await import('fs')
  const path = await import('path')

  const transcriptsDir = 'transcripts'
  if (!fs.existsSync(transcriptsDir)) {
    console.error(`${EMOJI.ERROR} ERROR: Transcripts directory not found: ${transcriptsDir}`)
    process.exit(1)
  }

  // Get all transcript files
  const files = fs
    .readdirSync(transcriptsDir)
    .filter(f => f.endsWith('.txt') && f.startsWith('transcript_'))

  console.log(`${EMOJI.SUCCESS} Found ${files.length} transcript files\n`)

  // Fetch candidates for context
  console.log(`${EMOJI.SEARCH} Fetching 2025 candidates from database...`)
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
    },
    include: {
      office: {
        include: {
          region: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  console.log(`${EMOJI.SUCCESS} Found ${candidates.length} candidates\n`)

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const videoEngagements: VideoEngagement[] = []

  // Process each transcript
  for (const filename of files) {
    const filePath = path.join(transcriptsDir, filename)

    // Extract video ID from filename: transcript_*_[videoId]_en.txt
    const videoIdMatch = filename.match(/_([A-Za-z0-9_-]+)_en\.txt$/)
    if (!videoIdMatch) {
      console.log(`${EMOJI.WARNING} Could not extract video ID from ${filename}, skipping`)
      continue
    }

    const videoId = videoIdMatch[1]
    console.log(`\n${EMOJI.PROCESSING} Processing video ${videoId}...`)

    // Read transcript
    const transcriptText = fs.readFileSync(filePath, 'utf-8')

    // Use AI to analyze the transcript
    console.log(`  ${EMOJI.ROBOT} Analyzing with Claude AI...`)

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are analyzing a transcript from a TCRC (Tri-City Regional Chamber of Commerce) candidate forum video.

Known 2025 candidates from our database:
${candidates.map(c => `${c.name} - ${c.office.title} (${c.office.region.name})`).join('\n')}

Task: Analyze this transcript and extract:
1. A descriptive title for the forum (e.g., "Richland City Council Position 6 Candidate Forum")
2. The office/race being discussed
3. Which candidates participated (match names to the database list above)

Return JSON with this structure:
{
  "title": "Forum title",
  "office": "Office name",
  "participants": ["Candidate Name 1", "Candidate Name 2"]
}

Rules:
- Only include candidates who actually participated (spoke in the video)
- Match candidate names exactly to the database list
- If you can't determine the information, return empty strings/arrays

Transcript:
${transcriptText.substring(0, 5000)}`,
        },
      ],
    })

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    let jsonText = responseText.trim()

    // Extract JSON from markdown code blocks
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1]
    } else {
      const objectMatch = jsonText.match(/(\{[\s\S]*\})/)
      if (objectMatch) {
        jsonText = objectMatch[1]
      }
    }

    try {
      const parsed = JSON.parse(jsonText)

      if (parsed.title && parsed.participants && parsed.participants.length > 0) {
        videoEngagements.push({
          videoId,
          title: parsed.title,
          office: parsed.office || 'Unknown',
          participants: parsed.participants,
        })

        console.log(`  ${EMOJI.SUCCESS} Found: ${parsed.title}`)
        console.log(`    Participants: ${parsed.participants.join(', ')}`)
      } else {
        console.log(`  ${EMOJI.WARNING} No participant data found`)
      }
    } catch (error) {
      console.error(`  ${EMOJI.ERROR} Failed to parse AI response`)
      console.error(`  Raw response: ${responseText.substring(0, 200)}...`)
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, RATE_LIMITS.AI_CALLS))
  }

  // Generate CSV rows (flatten engagements into candidate participation records)
  const csvRows: CsvRow[] = []
  const seen = new Set<string>() // Track unique candidate+video combinations

  for (const video of videoEngagements) {
    // For each video, we need to track:
    // 1. Who participated (from our AI analysis)
    // 2. Who didn't participate (other candidates for same office)

    // Find all candidates for this office
    const officeCandidates = candidates.filter(
      c => c.office.title.toLowerCase().includes(video.office.toLowerCase()) ||
           video.office.toLowerCase().includes(c.office.title.toLowerCase())
    )

    for (const candidate of officeCandidates) {
      const participated = video.participants.some(
        p => p.toLowerCase() === candidate.name.toLowerCase()
      )

      // Create unique key to prevent duplicates
      const key = `${video.videoId}|${candidate.id}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)

      csvRows.push({
        videoId: video.videoId,
        title: video.title,
        office: video.office,
        candidate: candidate.name,
        participated,
      })
    }
  }

  // Output CSV
  console.log('\n=== RESULTS ===')
  const csvHeaders = 'Video ID,Title,Office,Candidate,Participated'
  console.log(csvHeaders)

  const csvLines = csvRows.map(row =>
    [
      escapeCsvField(row.videoId),
      escapeCsvField(row.title),
      escapeCsvField(row.office),
      escapeCsvField(row.candidate),
      row.participated ? 'TRUE' : 'FALSE',
    ].join(',')
  )

  for (const line of csvLines) {
    console.log(line)
  }

  // Save to file
  const csv = [csvHeaders, ...csvLines].join('\n')
  const outputPath = isDryRun()
    ? 'scripts/import/tcrc-videos-dry-run.csv'
    : 'scripts/import/tcrc-videos.csv'

  fs.writeFileSync(outputPath, csv)

  // If not dry run, import to database
  if (!isDryRun()) {
    console.log(`\n${EMOJI.PROCESSING} Importing to database...\n`)

    let imported = 0
    let skipped = 0
    let errors = 0

    for (const video of videoEngagements) {
      try {
        const engagementSlug = generateEngagementSlug(
          `tcrc-video-${video.videoId}`,
          undefined
        )
        const engagementPrimaryLink = `https://www.youtube.com/watch?v=${video.videoId}`

        // Create or update engagement
        const engagement = await prisma.engagement.upsert({
          where: { slug: engagementSlug },
          create: {
            slug: engagementSlug,
            title: video.title,
            primaryLink: engagementPrimaryLink,
            notes: `TCRC candidate forum video - YouTube ID: ${video.videoId}`,
          },
          update: {
            title: video.title,
            primaryLink: engagementPrimaryLink,
          },
        })

        // Create candidate engagement records
        for (const participantName of video.participants) {
          const candidate = candidates.find(
            c => c.name.toLowerCase() === participantName.toLowerCase()
          )

          if (!candidate) {
            console.log(
              `${EMOJI.WARNING} No match for participant "${participantName}"`
            )
            skipped++
            continue
          }

          // Upsert candidate engagement
          await prisma.candidateEngagement.upsert({
            where: {
              engagementId_candidateId: {
                engagementId: engagement.id,
                candidateId: candidate.id,
              },
            },
            create: {
              engagementId: engagement.id,
              candidateId: candidate.id,
              participated: true,
              notes: 'Participated in video forum',
            },
            update: {
              participated: true,
              notes: 'Participated in video forum',
            },
          })

          imported++
        }

        console.log(`${EMOJI.SUCCESS} Imported: ${video.title}`)
      } catch (error) {
        console.error(`${EMOJI.ERROR} Error importing ${video.title}:`, error)
        errors++
      }
    }

    console.log(`\n${EMOJI.SUMMARY} Import Summary:`)
    console.log(`   Imported: ${imported}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Errors: ${errors}`)
  }

  // Summary
  console.log(`\n${EMOJI.SUMMARY} Summary:`)
  console.log(`   Videos analyzed: ${videoEngagements.length}`)
  console.log(`   CSV rows generated: ${csvRows.length}`)
  console.log(`\n${EMOJI.SUCCESS} Results saved to ${outputPath}`)

  if (isDryRun()) {
    console.log(
      `\n${EMOJI.INFO} To write to database, run: IMPORT_MODE=db npm run import:tcrc:videos`
    )
  }

  await prisma.$disconnect()
}

trackVideoParticipation().catch(console.error)

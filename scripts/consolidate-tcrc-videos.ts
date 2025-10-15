#!/usr/bin/env node
/**
 * Consolidate multiple TCRC Candidate Forum engagements into a single "TCRC Video" engagement
 *
 * This script:
 * 1. Finds all engagements with "Candidate Forum" in the title
 * 2. Creates/updates a single "TCRC Video" engagement with linkType: PER_CANDIDATE
 * 3. Migrates all participation data to the consolidated engagement
 * 4. Moves video links from engagement.primaryLink to candidateEngagement.link
 * 5. Deletes the old separate forum engagements
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding TCRC Candidate Forum engagements...')

  // Find all forum engagements
  const forumEngagements = await prisma.engagement.findMany({
    where: {
      title: {
        contains: 'Candidate Forum'
      }
    },
    include: {
      participants: {
        include: {
          candidate: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  console.log(`Found ${forumEngagements.length} forum engagements`)

  if (forumEngagements.length === 0) {
    console.log('No forum engagements found. Exiting.')
    return
  }

  // Find or create the consolidated "TCRC Video" engagement
  console.log('\n📝 Creating/updating consolidated "TCRC Video" engagement...')

  const consolidatedEngagement = await prisma.engagement.upsert({
    where: {
      slug: 'tcrc-video-2025'
    },
    create: {
      slug: 'tcrc-video-2025',
      title: 'TCRC Video',
      linkType: 'PER_CANDIDATE',
      date: forumEngagements[0]?.date || null,
      notes: 'Consolidated from multiple position-specific candidate forums'
    },
    update: {
      linkType: 'PER_CANDIDATE',
      title: 'TCRC Video'
    }
  })

  console.log(`✅ Consolidated engagement created: ${consolidatedEngagement.id}`)

  // Collect all participants across all forums
  const participantMap = new Map<string, {
    participated: boolean
    link?: string
    candidateName: string
  }>()

  for (const forum of forumEngagements) {
    console.log(`\n  Processing: ${forum.title}`)
    console.log(`    Participants: ${forum.participants.length}`)
    console.log(`    Video link: ${forum.primaryLink || 'none'}`)

    for (const participant of forum.participants) {
      const existing = participantMap.get(participant.candidateId)

      // Merge participation: if they participated in ANY forum, mark as participated
      participantMap.set(participant.candidateId, {
        participated: existing?.participated || participant.participated,
        // Keep the link from whichever entry has one (or the first one)
        link: existing?.link || forum.primaryLink || undefined,
        candidateName: participant.candidate.name
      })
    }
  }

  console.log(`\n📊 Unique candidates across all forums: ${participantMap.size}`)
  console.log(`   Participated: ${Array.from(participantMap.values()).filter(p => p.participated).length}`)
  console.log(`   Declined: ${Array.from(participantMap.values()).filter(p => !p.participated).length}`)

  // Migrate to consolidated engagement
  console.log('\n🔄 Migrating participation data...')

  for (const [candidateId, data] of participantMap.entries()) {
    await prisma.candidateEngagement.upsert({
      where: {
        engagementId_candidateId: {
          engagementId: consolidatedEngagement.id,
          candidateId: candidateId
        }
      },
      create: {
        engagementId: consolidatedEngagement.id,
        candidateId: candidateId,
        participated: data.participated,
        link: data.link || null
      },
      update: {
        participated: data.participated,
        link: data.link || null
      }
    })

    console.log(`  ✓ ${data.candidateName}: ${data.participated ? '✅ participated' : '❌ declined'}${data.link ? ' (link saved)' : ''}`)
  }

  // Delete old forum engagements
  console.log('\n🗑️  Deleting old forum engagements...')

  for (const forum of forumEngagements) {
    // First delete all participant records
    await prisma.candidateEngagement.deleteMany({
      where: {
        engagementId: forum.id
      }
    })

    // Then delete the engagement
    await prisma.engagement.delete({
      where: {
        id: forum.id
      }
    })

    console.log(`  ✓ Deleted: ${forum.title}`)
  }

  console.log('\n✨ Consolidation complete!')
  console.log(`\n📋 Summary:`)
  console.log(`  - Consolidated ${forumEngagements.length} forum engagements into 1`)
  console.log(`  - Migrated ${participantMap.size} candidate participation records`)
  console.log(`  - Set linkType to PER_CANDIDATE for individual video links`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

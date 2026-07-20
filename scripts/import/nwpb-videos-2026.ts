/**
 * NWPB Vote 2026 Candidate Interview Videos
 *
 * NWPB (Northwest Public Broadcasting) recorded individual interviews with the
 * U.S. House District 4 primary candidates, plus a full district forum. This
 * loads them as a PER_CANDIDATE engagement: each candidate links to their own
 * interview, and the shared forum rides along as the engagement's secondary link.
 *
 * Idempotent: upserts the engagement and each candidate's participation.
 *
 * Source playlist: https://www.youtube.com/playlist?list=PL6pHcbVJ2q0FBsPPWI3e-qEfNSdVVJwBc
 *
 * Usage:
 *   npx tsx scripts/import/nwpb-videos-2026.ts --dry-run
 *   npx tsx scripts/import/nwpb-videos-2026.ts
 */
import 'dotenv/config'
import { PrismaClient, EngagementLinkType } from '@prisma/client'

const prisma = new PrismaClient()

const PLAYLIST = 'PL6pHcbVJ2q0FBsPPWI3e-qEfNSdVVJwBc'
const watch = (id: string) => `https://www.youtube.com/watch?v=${id}&list=${PLAYLIST}`

const ENGAGEMENT_SLUG = 'nwpb-video-cd4-2026'
const ENGAGEMENT_TITLE = 'NWPB Vote Candidate Interview'
const FORUM_URL = watch('imIfII6nkKg') // "4th Congressional District Primary Forum"

// DB candidate name -> NWPB interview video id.
const INTERVIEWS: Record<string, string> = {
  'Ken Vaz': 'sv_lugZKJ1c',
  'Favian Valencia': 'BgWpsEsEmxU',
  'Jerrod Sessler': 'fGwAPYREOx4',
  'Elpidia Saavedra': 'dZjvky61nPA',
  'Devin Poore': 'ZLNmBknXjSM',
  'Jacek "Jack" Kobiesa': 'Cc9L2MCLRso',
  'John C. Hughs': '_gruYWPgBa8',
  'John Duresky': 'JUv247SZ110',
  'Matt Boehnke': 'VHB-2uo2ErU',
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const engagement = dryRun
    ? null
    : await prisma.engagement.upsert({
        where: { slug: ENGAGEMENT_SLUG },
        create: {
          slug: ENGAGEMENT_SLUG,
          title: ENGAGEMENT_TITLE,
          date: new Date('2026-07-01'),
          linkType: EngagementLinkType.PER_CANDIDATE,
          secondaryLink: FORUM_URL,
          secondaryLinkTitle: '4th Congressional District Primary Forum',
          notes: 'Candidate interviews recorded by Northwest Public Broadcasting (NWPB Vote).',
        },
        update: {
          title: ENGAGEMENT_TITLE,
          linkType: EngagementLinkType.PER_CANDIDATE,
          secondaryLink: FORUM_URL,
          secondaryLinkTitle: '4th Congressional District Primary Forum',
        },
      })

  let linked = 0
  const unmatched: string[] = []

  for (const [name, videoId] of Object.entries(INTERVIEWS)) {
    const candidate = await prisma.candidate.findFirst({
      where: { electionYear: 2026, name: { equals: name, mode: 'insensitive' } },
      select: { id: true, name: true },
    })

    if (!candidate) {
      unmatched.push(name)
      console.log(`  ? no 2026 candidate matched "${name}"`)
      continue
    }

    const link = watch(videoId)
    if (dryRun) {
      console.log(`  + would link ${candidate.name} -> ${link}`)
      linked++
      continue
    }

    await prisma.candidateEngagement.upsert({
      where: {
        engagementId_candidateId: { engagementId: engagement!.id, candidateId: candidate.id },
      },
      create: {
        engagementId: engagement!.id,
        candidateId: candidate.id,
        participated: true,
        link,
      },
      update: { participated: true, link },
    })
    linked++
    console.log(`  + linked ${candidate.name}`)
  }

  console.log(
    `\n${dryRun ? '[dry run] ' : ''}linked=${linked} unmatched=${unmatched.length}` +
      (unmatched.length ? ` (${unmatched.join(', ')})` : '')
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

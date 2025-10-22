import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixEngagementUrls() {
  console.log('🔧 Fixing engagement URLs in database...\n')

  // Fix engagement primaryLink
  const engagements = await prisma.engagement.findMany({
    where: {
      OR: [
        { primaryLink: { startsWith: 'http://localhost:3000' } },
        { primaryLink: { startsWith: 'https://localhost:3000' } }
      ]
    }
  })

  for (const engagement of engagements) {
    const newLink = engagement.primaryLink.replace(/https?:\/\/localhost:3000/, '')
    await prisma.engagement.update({
      where: { id: engagement.id },
      data: { primaryLink: newLink }
    })
    console.log(`✓ Fixed engagement: ${engagement.title}`)
    console.log(`  ${engagement.primaryLink} → ${newLink}`)
  }

  // Fix candidateEngagement links
  const candidateEngagements = await prisma.candidateEngagement.findMany({
    where: {
      OR: [
        { link: { startsWith: 'http://localhost:3000' } },
        { link: { startsWith: 'https://localhost:3000' } }
      ]
    },
    include: {
      candidate: { select: { name: true } }
    }
  })

  for (const ce of candidateEngagements) {
    if (ce.link) {
      const newLink = ce.link.replace(/https?:\/\/localhost:3000/, '')
      await prisma.candidateEngagement.update({
        where: {
          engagementId_candidateId: {
            engagementId: ce.engagementId,
            candidateId: ce.candidateId
          }
        },
        data: { link: newLink }
      })
      console.log(`✓ Fixed candidate engagement: ${ce.candidate.name}`)
      console.log(`  ${ce.link} → ${newLink}`)
    }
  }

  console.log(`\n✅ All engagement URLs fixed! (${engagements.length} engagements, ${candidateEngagements.length} candidate engagements)`)
}

fixEngagementUrls()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

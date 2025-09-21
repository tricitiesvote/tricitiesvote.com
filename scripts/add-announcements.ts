import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAnnouncementsToGuides() {
  // Get guides for 2025 (current election year)
  const guides = await prisma.guide.findMany({
    where: {
      electionYear: 2025
    },
    include: {
      region: true
    }
  });

  console.log('Found guides:', guides.map(g => `${g.region.name} (${g.electionYear})`));

  // Define announcements for each region
  const announcementsByRegion = {
    'Pasco': `
- **Pasco Candidate Meet & Greet**
  - October 12, 2025, 6:00-8:00 PM
  - Pasco Library, Community Room
  - [More details](https://my.lwv.org/washington/benton-franklin-counties/event/pasco-candidate-meet-greet)
  - Hosted by League of Women Voters of Benton & Franklin Counties
`,

    'Kennewick': `
- **Kennewick Candidate Meet & Greet**
  - October 15, 2025, 6:00-8:00 PM
  - Kennewick Library, Meeting Room A
  - [More details](https://my.lwv.org/washington/benton-franklin-counties/event/kennewick-candidate-meet-greet)
  - Hosted by League of Women Voters of Benton & Franklin Counties
`,

    'Richland': `
- **Richland/West Richland Candidate Meet & Greet**
  - October 18, 2025, 6:00-8:00 PM
  - Richland Community Center, Conference Room B
  - [More details](https://my.lwv.org/washington/benton-franklin-counties/event/richlandwest-richland-candidate-meet-greet)
  - Hosted by League of Women Voters of Benton & Franklin Counties
`,

    'West Richland': `
- **Richland/West Richland Candidate Meet & Greet**
  - October 18, 2025, 6:00-8:00 PM
  - Richland Community Center, Conference Room B
  - [More details](https://my.lwv.org/washington/benton-franklin-counties/event/richlandwest-richland-candidate-meet-greet)
  - Hosted by League of Women Voters of Benton & Franklin Counties
`
  };

  // Update each guide with appropriate announcements
  for (const guide of guides) {
    const regionName = guide.region.name;
    const announcements = announcementsByRegion[regionName as keyof typeof announcementsByRegion];

    if (announcements) {
      console.log(`Adding announcements to ${regionName} guide...`);

      await prisma.guide.update({
        where: { id: guide.id },
        data: {
          announcements: announcements.trim()
        }
      });

      console.log(`✓ Updated ${regionName} guide with announcements`);
    } else {
      console.log(`⚠ No announcements defined for ${regionName}`);
    }
  }

  console.log('Done adding announcements to guides!');
}

async function main() {
  try {
    await addAnnouncementsToGuides();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
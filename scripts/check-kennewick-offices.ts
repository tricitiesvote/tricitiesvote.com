import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkKennewickOffices() {
  console.log('Checking all Kennewick offices in 2025...\n');
  
  // Get all offices for Kennewick
  const offices = await prisma.office.findMany({
    where: {
      region: {
        name: 'Kennewick'
      }
    },
    include: {
      region: true,
      races: {
        where: {
          electionYear: 2025
        },
        include: {
          candidates: {
            include: {
              candidate: true
            }
          }
        }
      },
      candidates: {
        where: {
          electionYear: 2025
        }
      }
    },
    orderBy: {
      title: 'asc'
    }
  });

  console.log(`Found ${offices.length} Kennewick offices:\n`);
  
  offices.forEach(office => {
    console.log(`Office: "${office.title}"`);
    console.log(`  ID: ${office.id}`);
    console.log(`  Type: ${office.type}`);
    console.log(`  2025 Candidates: ${office.candidates.length}`);
    
    if (office.races.length > 0) {
      console.log(`  2025 Races: ${office.races.length}`);
      office.races.forEach(race => {
        console.log(`    - Race ID: ${race.id}`);
        console.log(`      Candidates in race: ${race.candidates.length}`);
        race.candidates.forEach(cr => {
          console.log(`        - ${cr.candidate.name}`);
        });
      });
    }
    console.log('');
  });

  // Check specifically for City Council offices
  const cityCouncilOffices = offices.filter(o => 
    o.type === 'CITY_COUNCIL' || o.title.toLowerCase().includes('council')
  );
  
  console.log(`\nCity Council offices: ${cityCouncilOffices.length}`);
  cityCouncilOffices.forEach(o => {
    console.log(`  - "${o.title}" (ID: ${o.id})`);
  });

  await prisma.$disconnect();
}

checkKennewickOffices().catch(console.error);
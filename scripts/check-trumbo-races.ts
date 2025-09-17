import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTrumboRaces() {
  console.log('Analyzing Trumbo candidates and their races...\n');
  
  // Get Trumbo candidates with full race information
  const trumboCandidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      name: {
        contains: 'Trumbo'
      }
    },
    include: {
      races: {
        include: {
          race: {
            include: {
              office: {
                include: {
                  region: true
                }
              }
            }
          }
        }
      },
      office: {
        include: {
          region: true
        }
      },
      contributions: {
        select: {
          amount: true
        }
      }
    }
  });

  console.log(`Found ${trumboCandidates.length} Trumbo candidates:\n`);
  
  trumboCandidates.forEach((cand, idx) => {
    console.log(`${idx + 1}. ${cand.name}`);
    console.log(`   ID: ${cand.id}`);
    console.log(`   Office: ${cand.office?.title || 'No office'} (${cand.office?.region?.name || 'No region'})`);
    console.log(`   Office ID: ${cand.officeId}`);
    console.log(`   Contributions: ${cand.contributions.length} (Total: $${cand.contributions.reduce((sum, c) => sum + c.amount, 0).toFixed(2)})`);
    
    if (cand.races.length > 0) {
      console.log(`   Races:`);
      cand.races.forEach(cr => {
        console.log(`     - Race ID: ${cr.raceId}`);
        console.log(`       Office: ${cr.race.office.title} (${cr.race.office.region?.name || 'No region'})`);
        console.log(`       Office ID: ${cr.race.officeId}`);
      });
    } else {
      console.log(`   Races: None`);
    }
    console.log('');
  });

  // Check if these are potentially the same race
  if (trumboCandidates.length === 2) {
    const race1 = trumboCandidates[0].races[0]?.race;
    const race2 = trumboCandidates[1].races[0]?.race;
    
    if (race1 && race2) {
      console.log('\nRace comparison:');
      console.log(`Race 1 ID: ${trumboCandidates[0].races[0].raceId}`);
      console.log(`Race 2 ID: ${trumboCandidates[1].races[0].raceId}`);
      console.log(`Same race? ${trumboCandidates[0].races[0].raceId === trumboCandidates[1].races[0].raceId}`);
      
      // Check if the offices might be the same
      console.log('\nOffice comparison:');
      console.log(`Office 1: "${race1.office.title}" (ID: ${race1.officeId})`);
      console.log(`Office 2: "${race2.office.title}" (ID: ${race2.officeId})`);
      console.log(`Same office? ${race1.officeId === race2.officeId}`);
    }
  }

  await prisma.$disconnect();
}

checkTrumboRaces().catch(console.error);
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOfficeDuplicates() {
  console.log('Checking for potential office structure issues in 2025...\n');
  
  // Get all races with their offices and candidates for 2025
  const races = await prisma.race.findMany({
    where: {
      electionYear: 2025
    },
    include: {
      office: {
        include: {
          region: true
        }
      },
      candidates: {
        include: {
          candidate: true
        }
      }
    },
    orderBy: [
      {
        office: {
          region: {
            name: 'asc'
          }
        }
      },
      {
        office: {
          title: 'asc'
        }
      }
    ]
  });

  // Group races by region and office type
  const racesByRegion = new Map<string, typeof races>();
  
  races.forEach(race => {
    const region = race.office.region?.name || 'Unknown';
    const existing = racesByRegion.get(region) || [];
    racesByRegion.set(region, [...existing, race]);
  });

  // Check each region for potential issues
  racesByRegion.forEach((regionRaces, regionName) => {
    console.log(`\n${regionName}:`);
    console.log('='.repeat(regionName.length + 1));
    
    // Look for generic vs specific office patterns
    const genericOffices = regionRaces.filter(r => 
      r.office.title === `${regionName} City Council` ||
      r.office.title === `${regionName} School Board`
    );
    
    const specificOffices = regionRaces.filter(r => 
      (r.office.title.includes('Council') && r.office.title !== `${regionName} City Council`) ||
      (r.office.title.includes('School') && r.office.title !== `${regionName} School Board`)
    );
    
    if (genericOffices.length > 0 && specificOffices.length > 0) {
      console.log('\n⚠️  Found both generic and specific offices:');
      
      console.log('\nGeneric offices:');
      genericOffices.forEach(race => {
        console.log(`  - "${race.office.title}" (${race.candidates.length} candidates)`);
        race.candidates.forEach(cr => {
          console.log(`    • ${cr.candidate.name}`);
        });
      });
      
      console.log('\nSpecific offices:');
      specificOffices.forEach(race => {
        console.log(`  - "${race.office.title}" (${race.candidates.length} candidates)`);
        race.candidates.forEach(cr => {
          console.log(`    • ${cr.candidate.name}`);
        });
      });
    }
    
    // Show all races for the region
    console.log('\nAll races:');
    regionRaces.forEach(race => {
      console.log(`  ${race.office.title}: ${race.candidates.length} candidates`);
    });
  });

  // Check for races with only 1 candidate (potential duplicates)
  console.log('\n\nRaces with only 1 candidate (potential duplicate issues):');
  console.log('='.repeat(50));
  
  const singleCandidateRaces = races.filter(r => r.candidates.length === 1);
  singleCandidateRaces.forEach(race => {
    console.log(`\n${race.office.region?.name || 'Unknown'} - ${race.office.title}:`);
    console.log(`  Candidate: ${race.candidates[0].candidate.name}`);
    console.log(`  Office ID: ${race.office.id}`);
    console.log(`  Race ID: ${race.id}`);
  });

  await prisma.$disconnect();
}

checkOfficeDuplicates().catch(console.error);
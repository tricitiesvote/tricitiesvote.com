#!/usr/bin/env node
import { PrismaClient, ElectionType, OfficeType } from '@prisma/client';

const prisma = new PrismaClient();

interface PrepareOptions {
  dryRun?: boolean;
}

async function prepare2025(options: PrepareOptions = {}) {
  const { dryRun = false } = options;
  console.log(`\n🗳️  Preparing 2025 municipal election data ${dryRun ? '(DRY RUN)' : ''}...\n`);

  try {
    // 1. Ensure regions exist
    console.log('📍 Checking regions...');
    const regionNames = ['Kennewick', 'Pasco', 'Richland'];
    const regions = new Map<string, string>();
    
    for (const name of regionNames) {
      const existing = await prisma.region.findFirst({ where: { name } });
      if (existing) {
        regions.set(name, existing.id);
        console.log(`  ✓ Region exists: ${name}`);
      } else {
        console.log(`  ⚠️  Region missing: ${name} (would need to create)`);
      }
    }

    // 2. Create guides for 2025
    console.log('\n📋 Creating guides for 2025...');
    for (const [regionName, regionId] of regions) {
      // Check if guide already exists
      const existingGuide = await prisma.guide.findFirst({
        where: {
          electionYear: 2025,
          regionId,
          type: ElectionType.GENERAL
        }
      });

      if (!existingGuide) {
        if (!dryRun) {
          const guide = await prisma.guide.create({
            data: {
              electionYear: 2025,
              regionId,
              type: ElectionType.GENERAL
            }
          });
          console.log(`  ✓ Created guide for ${regionName} (${guide.id})`);
        } else {
          console.log(`  Would create guide for ${regionName}`);
        }
      } else {
        console.log(`  ✓ Guide already exists for ${regionName}`);
      }
    }

    // 3. Prepare expected offices for municipal elections
    console.log('\n🏛️  Preparing offices...');
    
    // Define expected offices for each city
    const expectedOffices = [
      // Kennewick offices
      { region: 'Kennewick', office: 'Kennewick City Council', positions: [1, 2, 3, 4, 5, 6, 7], type: OfficeType.CITY_COUNCIL },
      { region: 'Kennewick', office: 'Kennewick Mayor', positions: null, type: OfficeType.MAYOR },
      { region: 'Kennewick', office: 'Kennewick School Board', positions: [1, 2, 3, 4, 5], type: OfficeType.SCHOOL_BOARD },
      
      // Pasco offices
      { region: 'Pasco', office: 'Pasco City Council', positions: [1, 2, 3, 4, 5, 6, 7], type: OfficeType.CITY_COUNCIL },
      { region: 'Pasco', office: 'Pasco Mayor', positions: null, type: OfficeType.MAYOR },
      { region: 'Pasco', office: 'Pasco School Board', positions: [1, 2, 3, 4, 5], type: OfficeType.SCHOOL_BOARD },
      
      // Richland offices
      { region: 'Richland', office: 'Richland City Council', positions: [1, 2, 3, 4, 5, 6, 7], type: OfficeType.CITY_COUNCIL },
      { region: 'Richland', office: 'Richland Mayor', positions: null, type: OfficeType.MAYOR },
      { region: 'Richland', office: 'Richland School Board', positions: [1, 2, 3, 4, 5], type: OfficeType.SCHOOL_BOARD },
      
      // West Richland offices (under Richland region)
      { region: 'Richland', office: 'West Richland City Council', positions: [1, 2, 3, 4, 5, 6, 7], type: OfficeType.CITY_COUNCIL },
      { region: 'Richland', office: 'West Richland Mayor', positions: null, type: OfficeType.MAYOR },
      
      // Port Commissioner (cross-regional)
      { region: 'Benton County', office: 'Port of Benton Commissioner', positions: [1, 2, 3], type: OfficeType.PORT_COMMISSIONER },
      { region: 'Kennewick', office: 'Port of Kennewick Commissioner', positions: [1, 2, 3], type: OfficeType.PORT_COMMISSIONER },
    ];

    // Ensure Benton County region exists
    let bentonCountyId = regions.get('Benton County');
    if (!bentonCountyId) {
      const bentonCounty = await prisma.region.findFirst({ where: { name: 'Benton County' } });
      if (bentonCounty) {
        bentonCountyId = bentonCounty.id;
        regions.set('Benton County', bentonCounty.id);
      }
    }

    // Create offices
    for (const { region, office, positions, type } of expectedOffices) {
      const regionId = regions.get(region);
      if (!regionId) {
        console.log(`  ⚠️  Skipping ${office} - region ${region} not found`);
        continue;
      }

      // Create office with positions or single office
      if (positions) {
        for (const position of positions) {
          const title = `${office} Pos ${position}`;
          const jobTitle = type === OfficeType.SCHOOL_BOARD ? 'Board member' : 
                          type === OfficeType.PORT_COMMISSIONER ? 'Commissioner' :
                          'Council member';
          
          const existing = await prisma.office.findFirst({
            where: { regionId, title }
          });

          if (!existing) {
            if (!dryRun) {
              await prisma.office.create({
                data: { title, type, regionId, position, jobTitle }
              });
              console.log(`  ✓ Created office: ${title}`);
            } else {
              console.log(`  Would create office: ${title}`);
            }
          }
        }
      } else {
        // Single office (e.g., Mayor)
        const existing = await prisma.office.findFirst({
          where: { regionId, title: office }
        });

        if (!existing) {
          const jobTitle = type === OfficeType.MAYOR ? 'Mayor' : 'Official';
          if (!dryRun) {
            await prisma.office.create({
              data: { title: office, type, regionId, jobTitle }
            });
            console.log(`  ✓ Created office: ${office}`);
          } else {
            console.log(`  Would create office: ${office}`);
          }
        }
      }
    }

    // 4. Display summary
    console.log('\n📊 Summary:');
    const guideCount = await prisma.guide.count({ where: { electionYear: 2025 } });
    const raceCount = await prisma.race.count({ where: { electionYear: 2025 } });
    const candidateCount = await prisma.candidate.count({ where: { electionYear: 2025 } });
    
    console.log(`  - Guides: ${guideCount}`);
    console.log(`  - Races: ${raceCount}`);
    console.log(`  - Candidates: ${candidateCount}`);
    
    console.log('\n✅ 2025 election preparation complete!');
    console.log('\nNext steps:');
    console.log('1. Obtain Election IDs from VoteWA for 2025 Primary and General elections');
    console.log('2. Update legacy/data/json/load-config-election.json with election metadata');
    console.log('3. Run "npm run import:pdc 2025" to import candidate filings when available');
    console.log('4. Run "npm run import:pamphlet" when voter pamphlet is published');

  } catch (error) {
    console.error('\n❌ Error preparing 2025 data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

prepare2025({ dryRun })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
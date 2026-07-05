#!/usr/bin/env node
import { PrismaClient, ElectionType, OfficeType } from '@prisma/client';

const prisma = new PrismaClient();

const ELECTION_YEAR = 2026;
const BASELINE_YEAR = 2022; // last midterm (even-year/county) cycle

interface PrepareOptions {
  dryRun?: boolean;
  electionType: ElectionType;
}

// Regions needed for an even-year (county) election:
// Benton/Franklin County get guides; the rest are homes for state,
// federal, and bi-county offices.
const REQUIRED_REGIONS = [
  'Benton County',
  'Franklin County',
  'Washington State',
  'United States',
  'Benton-Franklin Counties',
];

const GUIDE_REGIONS = ['Benton County', 'Franklin County'];

// --- Mapping helpers (mirrors scripts/migrate/dynamic-base.ts) ---

function mapOfficeTypeString(office: string): OfficeType {
  const typeMap: Record<string, OfficeType> = {
    'City Council': 'CITY_COUNCIL',
    'School Board': 'SCHOOL_BOARD',
    'Port Commissioner': 'PORT_COMMISSIONER',
    'County Commissioner': 'COUNTY_COMMISSIONER',
    'State Representative': 'STATE_REPRESENTATIVE',
    'State Senator': 'STATE_SENATOR',
    'Superior Court Judge': 'SUPERIOR_COURT_JUDGE',
    'U.S. House': 'US_HOUSE',
    'U.S. Senate': 'US_SENATE',
    'County Prosecutor': 'PROSECUTOR',
    'County Sheriff': 'SHERIFF',
    Sheriff: 'SHERIFF',
    Prosecutor: 'PROSECUTOR',
    Mayor: 'MAYOR',
  };

  if (typeMap[office]) return typeMap[office];

  // Fall back to substring matching for titles that carry district or
  // position suffixes (e.g. "State Representative 8th District Pos 1")
  if (office.includes('State Representative')) return 'STATE_REPRESENTATIVE';
  if (office.includes('State Senator')) return 'STATE_SENATOR';
  if (office.includes('County Commissioner')) return 'COUNTY_COMMISSIONER';
  if (office.includes('Superior Court')) return 'SUPERIOR_COURT_JUDGE';
  if (office.includes('U.S. House')) return 'US_HOUSE';
  if (office.includes('U.S. Senate')) return 'US_SENATE';
  if (office.includes('Sheriff')) return 'SHERIFF';
  if (office.includes('Prosecutor')) return 'PROSECUTOR';

  return 'CITY_COUNCIL'; // Default fallback
}

function inferRegionFromOffice(office: string): string {
  // Handle specific legislative districts
  if (office.includes('16th District') || office.includes('District 16')) {
    return 'Franklin County'; // 16th District serves Franklin County
  }
  if (
    office.includes('8th District') ||
    office.includes('District 8') ||
    office.includes('9th District')
  ) {
    return 'Benton County'; // 8th/9th Districts serve Benton County
  }

  // For county-level offices with specific counties
  if (office.includes('Franklin County') || office.includes('Franklin Commissioner')) {
    return 'Franklin County';
  }
  if (office.includes('Benton County') || office.includes('Benton Commissioner')) {
    return 'Benton County';
  }

  // Generic county offices default to Benton County
  if (
    office.includes('County') ||
    office === 'County Commissioner' ||
    office === 'County Prosecutor' ||
    office === 'County Sheriff'
  ) {
    return 'Benton County';
  }

  // For state-level offices, use a state-wide region
  if (office.includes('State') || office === 'State Representative' || office === 'State Senator') {
    return 'Washington State';
  }

  // For federal offices
  if (office.includes('U.S.') || office === 'U.S. House' || office === 'U.S. Senate') {
    return 'United States';
  }

  // For superior court judges (bi-county)
  if (office === 'Superior Court Judge' || office.includes('Superior Court')) {
    return 'Benton-Franklin Counties';
  }

  return 'Benton County'; // Sensible default for a county-year script
}

function getJobTitle(office: string): string {
  const jobTitleMap: Record<string, string> = {
    'County Commissioner': 'Commissioner',
    'State Representative': 'Representative',
    'State Senator': 'Senator',
    'Superior Court Judge': 'Judge',
    'U.S. House': 'Representative',
    'U.S. Senate': 'Senator',
    'County Prosecutor': 'Prosecutor',
    'County Sheriff': 'Sheriff',
    Sheriff: 'Sheriff',
    Prosecutor: 'Prosecutor',
  };

  if (jobTitleMap[office]) return jobTitleMap[office];

  if (office.includes('State Representative') || office.includes('U.S. House')) return 'Representative';
  if (office.includes('State Senator') || office.includes('U.S. Senate')) return 'Senator';
  if (office.includes('Commissioner')) return 'Commissioner';
  if (office.includes('Superior Court')) return 'Judge';
  if (office.includes('Sheriff')) return 'Sheriff';
  if (office.includes('Prosecutor')) return 'Prosecutor';

  return 'Official';
}

function getRegionCode(name: string): string {
  const codeMap: Record<string, string> = {
    'Benton County': 'BC',
    'Franklin County': 'FC',
    'Washington State': 'WA',
    'United States': 'US',
    'Benton-Franklin Counties': 'BF',
  };
  return codeMap[name] || name.substring(0, 3).toUpperCase();
}

function parsePosition(title: string): number | null {
  const match = title.match(/Pos(?:ition)?\s+(\d+)\s*$/i);
  return match ? parseInt(match[1], 10) : null;
}

// --- Baseline discovery ---

interface BaselineOffice {
  title: string;
  type: OfficeType;
  regionName: string;
  position: number | null;
  jobTitle: string;
}

// Offices that ran in the last midterm cycle form the expected set for
// 2026. Prefer offices attached to races; if no race rows exist for the
// baseline year (historical imports linked candidates directly to
// offices), fall back to offices referenced by candidates.
async function discoverBaselineOffices(): Promise<BaselineOffice[]> {
  const races = await prisma.race.findMany({
    where: { electionYear: BASELINE_YEAR },
    include: { office: true },
  });

  let offices = races.map(r => r.office);
  let source = 'races';

  if (offices.length === 0) {
    const candidates = await prisma.candidate.findMany({
      where: { electionYear: BASELINE_YEAR },
      include: { office: true },
    });
    offices = candidates.map(c => c.office);
    source = 'candidates';
  }

  const byTitle = new Map<string, BaselineOffice>();
  let skipped = 0;
  for (const office of offices) {
    const title = office.title.trim();
    if (!title || office.type === 'BALLOT_MEASURE') {
      skipped++;
      continue;
    }
    if (byTitle.has(title)) continue;
    byTitle.set(title, {
      title,
      type: mapOfficeTypeString(title),
      regionName: inferRegionFromOffice(title),
      position: office.position ?? parsePosition(title),
      jobTitle: getJobTitle(title),
    });
  }

  console.log(
    `  Found ${byTitle.size} unique office(s) via ${BASELINE_YEAR} ${source}` +
      (skipped ? ` (skipped ${skipped} record(s) with blank/measure offices)` : '')
  );

  return Array.from(byTitle.values()).sort((a, b) => a.title.localeCompare(b.title));
}

// --- Main ---

async function prepare2026(options: PrepareOptions) {
  const { dryRun = false, electionType } = options;
  console.log(
    `\n🗳️  Preparing ${ELECTION_YEAR} ${electionType.toLowerCase()} election data ${dryRun ? '(DRY RUN)' : ''}...\n`
  );

  const created = { regions: 0, offices: 0, guides: 0 };
  const existing = { regions: 0, offices: 0, guides: 0 };

  // Placeholder id for regions that a dry run would have created
  const DRY_RUN_PENDING = '';

  try {
    // 1. Ensure regions exist
    console.log('📍 Checking regions...');
    const regions = new Map<string, string>();

    for (const name of REQUIRED_REGIONS) {
      const found = await prisma.region.findUnique({ where: { name } });
      if (found) {
        regions.set(name, found.id);
        existing.regions++;
        console.log(`  ✓ Region exists: ${name}`);
      } else if (!dryRun) {
        const region = await prisma.region.create({
          data: { name, code: getRegionCode(name) },
        });
        regions.set(name, region.id);
        created.regions++;
        console.log(`  ✓ Created region: ${name} (${region.code})`);
      } else {
        regions.set(name, DRY_RUN_PENDING);
        created.regions++;
        console.log(`  Would create region: ${name} (${getRegionCode(name)})`);
      }
    }

    // 2. Ensure expected offices exist, based on the last midterm cycle
    console.log(`\n🏛️  Checking offices (baseline: ${BASELINE_YEAR})...`);
    const baseline = await discoverBaselineOffices();

    if (baseline.length === 0) {
      console.log(`  ⚠️  No ${BASELINE_YEAR} offices found in the database - nothing to verify`);
    }

    for (const office of baseline) {
      if (regions.get(office.regionName) === undefined) {
        // Region outside the county-year set; look it up directly before
        // giving up.
        const region = await prisma.region.findUnique({ where: { name: office.regionName } });
        if (region) {
          regions.set(office.regionName, region.id);
        } else {
          console.log(`  ⚠️  Skipping ${office.title} - region ${office.regionName} not found`);
          continue;
        }
      }
      const resolvedRegionId = regions.get(office.regionName)!;

      if (resolvedRegionId === DRY_RUN_PENDING) {
        created.offices++;
        console.log(`  Would create office: ${office.title} (${office.regionName}, ${office.type})`);
        continue;
      }

      const found = await prisma.office.findUnique({
        where: { regionId_title: { regionId: resolvedRegionId, title: office.title } },
      });

      if (found) {
        existing.offices++;
        console.log(`  ✓ Office exists: ${office.title} (${office.regionName})`);
      } else if (!dryRun) {
        await prisma.office.create({
          data: {
            title: office.title,
            type: office.type,
            regionId: resolvedRegionId,
            position: office.position,
            jobTitle: office.jobTitle,
          },
        });
        created.offices++;
        console.log(`  ✓ Created office: ${office.title} (${office.regionName}, ${office.type})`);
      } else {
        created.offices++;
        console.log(`  Would create office: ${office.title} (${office.regionName}, ${office.type})`);
      }
    }

    // Federal races run in midterm years but may be missing from the
    // baseline if the historical import never captured them.
    const hasFederal = baseline.some(o => o.type === 'US_HOUSE' || o.type === 'US_SENATE');
    if (!hasFederal) {
      console.log(
        `  ⚠️  No U.S. House/Senate offices in the ${BASELINE_YEAR} baseline - ` +
          'federal offices will need to be created when candidates are imported'
      );
    }

    // 3. Create county guides for the election year
    console.log(`\n📋 Creating guides for ${ELECTION_YEAR} (${electionType})...`);
    for (const regionName of GUIDE_REGIONS) {
      const regionId = regions.get(regionName);
      if (regionId === undefined) {
        console.log(`  ⚠️  Skipping guide for ${regionName} - region not found`);
        continue;
      }

      if (regionId === DRY_RUN_PENDING) {
        created.guides++;
        console.log(`  Would create guide for ${regionName}`);
        continue;
      }

      const existingGuide = await prisma.guide.findFirst({
        where: { electionYear: ELECTION_YEAR, regionId, type: electionType },
      });

      if (existingGuide) {
        existing.guides++;
        console.log(`  ✓ Guide already exists for ${regionName}`);
      } else if (!dryRun) {
        const guide = await prisma.guide.create({
          data: { electionYear: ELECTION_YEAR, regionId, type: electionType },
        });
        created.guides++;
        console.log(`  ✓ Created guide for ${regionName} (${guide.id})`);
      } else {
        created.guides++;
        console.log(`  Would create guide for ${regionName}`);
      }
    }

    // 4. Display summary
    console.log('\n📊 Summary:');
    console.log(`  - Regions: ${created.regions} created, ${existing.regions} existing`);
    console.log(`  - Offices: ${created.offices} created, ${existing.offices} existing`);
    console.log(`  - Guides:  ${created.guides} created, ${existing.guides} existing`);

    const guideCount = await prisma.guide.count({ where: { electionYear: ELECTION_YEAR } });
    const raceCount = await prisma.race.count({ where: { electionYear: ELECTION_YEAR } });
    const candidateCount = await prisma.candidate.count({ where: { electionYear: ELECTION_YEAR } });

    console.log(`  - Total ${ELECTION_YEAR} guides: ${guideCount}`);
    console.log(`  - Total ${ELECTION_YEAR} races: ${raceCount}`);
    console.log(`  - Total ${ELECTION_YEAR} candidates: ${candidateCount}`);

    console.log(`\n✅ ${ELECTION_YEAR} election preparation complete!`);
    console.log('\nNext steps:');
    console.log(`1. Obtain Election IDs from VoteWA for the ${ELECTION_YEAR} elections`);
    console.log('2. Update legacy/data/json/load-config-election.json with election metadata');
    console.log(`3. Run "npm run import:pdc ${ELECTION_YEAR}" to import candidate filings when available`);
    console.log('4. Run "npm run import:pamphlet" when voter pamphlet is published');
  } catch (error) {
    console.error(`\n❌ Error preparing ${ELECTION_YEAR} data:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
function parseElectionType(args: string[]): ElectionType {
  let raw = 'primary';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      raw = args[i + 1];
    } else if (args[i].startsWith('--type=')) {
      raw = args[i].slice('--type='.length);
    }
  }

  const normalized = raw.toLowerCase();
  if (normalized === 'primary') return ElectionType.PRIMARY;
  if (normalized === 'general') return ElectionType.GENERAL;

  console.error(`Invalid --type "${raw}". Use "primary" or "general".`);
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const electionType = parseElectionType(args);

prepare2026({ dryRun, electionType }).catch(error => {
  console.error(error);
  process.exit(1);
});

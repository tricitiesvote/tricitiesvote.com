#!/usr/bin/env node
/**
 * Fixes office types in the database based on office titles
 * Usage: npx tsx scripts/utils/fix-office-types.ts
 * 
 * This utility ensures that offices have the correct type (SCHOOL_BOARD, PORT_COMMISSIONER, etc.)
 * based on their title. Useful when importing data that may have incorrect types.
 */
import { PrismaClient, OfficeType } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOfficeTypes() {
  console.log('🔧 Fixing office types...\n');

  try {
    // Fix School Board offices
    const schoolBoardResult = await prisma.office.updateMany({
      where: {
        title: { contains: 'School' }
      },
      data: {
        type: OfficeType.SCHOOL_BOARD
      }
    });
    console.log(`✓ Updated ${schoolBoardResult.count} School Board offices to SCHOOL_BOARD type`);

    // Fix Port Commissioner offices
    const portResult = await prisma.office.updateMany({
      where: {
        OR: [
          { title: { contains: 'Port of' } },
          { title: { contains: 'Port Commissioner' } },
          { title: { contains: 'Port District' } }
        ]
      },
      data: {
        type: OfficeType.PORT_COMMISSIONER
      }
    });
    console.log(`✓ Updated ${portResult.count} Port Commissioner offices to PORT_COMMISSIONER type`);

    // Fix Mayor offices
    const mayorResult = await prisma.office.updateMany({
      where: {
        title: { contains: 'Mayor' }
      },
      data: {
        type: OfficeType.MAYOR
      }
    });
    console.log(`✓ Updated ${mayorResult.count} Mayor offices to MAYOR type`);

    // Fix Sheriff offices
    const sheriffResult = await prisma.office.updateMany({
      where: {
        title: { contains: 'Sheriff' }
      },
      data: {
        type: OfficeType.SHERIFF
      }
    });
    console.log(`✓ Updated ${sheriffResult.count} Sheriff offices to SHERIFF type`);

    // Fix Prosecutor offices
    const prosecutorResult = await prisma.office.updateMany({
      where: {
        title: { contains: 'Prosecutor' }
      },
      data: {
        type: OfficeType.PROSECUTOR
      }
    });
    console.log(`✓ Updated ${prosecutorResult.count} Prosecutor offices to PROSECUTOR type`);

    // Fix State Representative offices
    const stateRepResult = await prisma.office.updateMany({
      where: {
        AND: [
          { title: { contains: 'State' } },
          { title: { contains: 'Representative' } }
        ]
      },
      data: {
        type: OfficeType.STATE_REPRESENTATIVE
      }
    });
    console.log(`✓ Updated ${stateRepResult.count} State Representative offices to STATE_REPRESENTATIVE type`);

    // Fix State Senator offices
    const stateSenResult = await prisma.office.updateMany({
      where: {
        AND: [
          { title: { contains: 'State' } },
          { title: { contains: 'Senator' } }
        ]
      },
      data: {
        type: OfficeType.STATE_SENATOR
      }
    });
    console.log(`✓ Updated ${stateSenResult.count} State Senator offices to STATE_SENATOR type`);

    // Fix County Commissioner offices
    const countyCommResult = await prisma.office.updateMany({
      where: {
        AND: [
          { title: { contains: 'County' } },
          { title: { contains: 'Commissioner' } }
        ]
      },
      data: {
        type: OfficeType.COUNTY_COMMISSIONER
      }
    });
    console.log(`✓ Updated ${countyCommResult.count} County Commissioner offices to COUNTY_COMMISSIONER type`);

    // Fix Superior Court Judge offices
    const judgeResult = await prisma.office.updateMany({
      where: {
        title: { contains: 'Superior Court' }
      },
      data: {
        type: OfficeType.SUPERIOR_COURT_JUDGE
      }
    });
    console.log(`✓ Updated ${judgeResult.count} Superior Court Judge offices to SUPERIOR_COURT_JUDGE type`);

    // Verify the changes
    console.log('\n📊 Verification:');
    const officeTypes = await prisma.office.groupBy({
      by: ['type'],
      _count: true,
      orderBy: {
        _count: {
          type: 'desc'
        }
      }
    });

    officeTypes.forEach(({ type, _count }) => {
      console.log(`  ${type}: ${_count} offices`);
    });

    console.log('\n✅ Office type fixes complete!');
    
  } catch (error) {
    console.error('❌ Error fixing office types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixOfficeTypes()
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { fixOfficeTypes };
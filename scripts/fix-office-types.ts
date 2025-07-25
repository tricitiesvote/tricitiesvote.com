#!/usr/bin/env node
import { PrismaClient, OfficeType } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOfficeTypes() {
  console.log('🔧 Fixing office types...\n');

  try {
    // Fix School Board offices
    const schoolBoardResult = await prisma.office.updateMany({
      where: {
        title: { contains: 'School Board' }
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
          { title: { contains: 'Port Commissioner' } }
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

fixOfficeTypes()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
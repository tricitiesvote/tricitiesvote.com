import { PrismaClient } from '@prisma/client';
import { ensureUserPublicId } from '../../lib/wiki/publicId';

const prisma = new PrismaClient();

async function backfillPublicIds() {
  const users = await prisma.user.findMany({
    where: { publicId: null },
    select: { id: true, email: true }
  });

  if (users.length === 0) {
    console.log('All users already have publicIds.');
    return;
  }

  console.log(`Backfilling publicIds for ${users.length} user(s)...`);

  for (const user of users) {
    const publicId = await ensureUserPublicId(prisma, user.id);
    console.log(` - ${user.email ?? user.id} -> ${publicId}`);
  }

  console.log('Done.');
}

async function main() {
  try {
    await backfillPublicIds();
  } catch (error) {
    console.error('Failed to backfill publicIds:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

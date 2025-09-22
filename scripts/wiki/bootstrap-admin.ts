import { PrismaClient, UserRole } from '@prisma/client';
import { ensureUserPublicId, generateUniquePublicId } from '../../lib/wiki/publicId';

const prisma = new PrismaClient();

async function ensureAdmin(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email is required');
  }

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      role: UserRole.ADMIN
    },
    create: {
      email: normalizedEmail,
      role: UserRole.ADMIN,
      publicId: await generateUniquePublicId(prisma)
    }
  });

  const publicId = await ensureUserPublicId(prisma, user.id);

  console.log(`✅ User ${normalizedEmail} is now an ADMIN (id: ${user.id}, publicId: ${publicId}).`);
}

async function main() {
  try {
    const emailArg = process.argv[2] ?? 'guide@tricitiesvote.com';
    await ensureAdmin(emailArg);
  } catch (error) {
    console.error('Failed to bootstrap admin:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

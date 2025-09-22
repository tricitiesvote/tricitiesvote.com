import type { PrismaClient } from '@prisma/client';
import { generatePublicId } from './generatePublicId';

export async function generateUniquePublicId(
  prisma: PrismaClient,
  attempts = 10
): Promise<string> {
  for (let i = 0; i < attempts; i += 1) {
    const candidate = generatePublicId();
    const existing = await prisma.user.findUnique({ where: { publicId: candidate } });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique publicId after multiple attempts');
}

export async function ensureUserPublicId(
  prisma: PrismaClient,
  userId: string
): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { publicId: true }
  });

  if (existing?.publicId) {
    return existing.publicId;
  }

  const publicId = await generateUniquePublicId(prisma);

  await prisma.user.update({
    where: { id: userId },
    data: { publicId }
  });

  return publicId;
}

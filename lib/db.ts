import { PrismaClient } from '@prisma/client'

type PrismaClientLooselyTyped = PrismaClient & Record<string, any>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientLooselyTyped | undefined
}

export const prisma = globalForPrisma.prisma ?? (new PrismaClient() as PrismaClientLooselyTyped)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

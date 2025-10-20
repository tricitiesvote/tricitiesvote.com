export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';

type AllowedRole = 'MODERATOR' | 'ADMIN';
const ALLOWED_ROLES: AllowedRole[] = ['MODERATOR', 'ADMIN'];

async function getAuthenticatedUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) return null;

  const payload = verifyToken(sessionCookie.value);
  if (!payload) return null;

  return await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      role: true
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !ALLOWED_ROLES.includes(user.role as AllowedRole)) {
      return NextResponse.json(
        { error: 'Moderator access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const roleFilter = searchParams.get('role');
    const limitParam = searchParams.get('limit');

    const take = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 100) : 50;

    const where: any = {};

    if (roleFilter && ['COMMUNITY', 'CANDIDATE', 'MODERATOR', 'ADMIN'].includes(roleFilter)) {
      where.role = roleFilter;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, roleCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [
          { role: 'desc' },
          { editsAccepted: 'desc' },
          { createdAt: 'desc' }
        ],
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          editsAccepted: true,
          editsRejected: true,
          editsPending: true,
          candidateId: true,
          createdAt: true,
          updatedAt: true,
          publicId: true
        }
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true }
      })
    ]);

    const totalsByRole: Record<'COMMUNITY' | 'CANDIDATE' | 'MODERATOR' | 'ADMIN', number> = {
      COMMUNITY: 0,
      CANDIDATE: 0,
      MODERATOR: 0,
      ADMIN: 0
    };

    for (const row of roleCounts) {
      totalsByRole[row.role as keyof typeof totalsByRole] = row._count._all;
    }

    const overallTotal = Object.values(totalsByRole).reduce((sum, value) => sum + value, 0);

    return NextResponse.json({
      users,
      totals: {
        overall: overallTotal,
        byRole: totalsByRole
      }
    });
  } catch (error) {
    console.error('Wiki admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    );
  }
}

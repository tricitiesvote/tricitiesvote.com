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

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [pendingBreakdown, oldestPending, approvalsLastWeek, rejectionsLastWeek, recentModeratedEdits, topContributors, moderatorCounts] = await Promise.all([
      prisma.edit.groupBy({
        by: ['entityType'],
        where: { status: 'PENDING' },
        _count: { _all: true }
      }),
      prisma.edit.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, entityType: true, entityId: true, field: true, createdAt: true }
      }),
      prisma.edit.count({
        where: {
          status: 'APPROVED',
          reviewedAt: { gte: sevenDaysAgo }
        }
      }),
      prisma.edit.count({
        where: {
          status: 'REJECTED',
          reviewedAt: { gte: sevenDaysAgo }
        }
      }),
      prisma.edit.findMany({
        where: {
          status: { in: ['APPROVED', 'REJECTED'] },
          reviewedAt: { not: null }
        },
        orderBy: { reviewedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          status: true,
          field: true,
          entityType: true,
          entityId: true,
          rationale: true,
          reviewedAt: true,
          moderatorNote: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              publicId: true,
              role: true
            }
          },
          moderator: {
            select: {
              id: true,
              email: true,
              name: true,
              publicId: true,
              role: true
            }
          }
        }
      }),
      prisma.user.findMany({
        orderBy: {
          editsAccepted: 'desc'
        },
        take: 6,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          editsAccepted: true,
          editsRejected: true,
          editsPending: true,
          createdAt: true,
          publicId: true
        }
      }),
      prisma.edit.groupBy({
        by: ['moderatorId'],
        where: {
          status: { in: ['APPROVED', 'REJECTED'] },
          reviewedAt: { gte: sevenDaysAgo },
          moderatorId: { not: null }
        },
        _count: { moderatorId: true },
        orderBy: {
          _count: { moderatorId: 'desc' }
        },
        take: 5
      })
    ]);

    const pendingByEntity: Record<string, number> = {
      CANDIDATE: 0,
      RACE: 0,
      OFFICE: 0,
      GUIDE: 0
    };

    for (const row of pendingBreakdown) {
      pendingByEntity[row.entityType] = row._count._all;
    }

    const pendingTotal = Object.values(pendingByEntity).reduce((sum, value) => sum + value, 0);

    const moderatorIds = moderatorCounts
      .map((row) => row.moderatorId)
      .filter((id): id is string => Boolean(id));

    const moderators = moderatorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: moderatorIds } },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            publicId: true
          }
        })
      : [];

    const topModerators = moderatorCounts.map((row) => {
      const moderator = moderators.find((mod) => mod.id === row.moderatorId);
      return {
        moderatorId: row.moderatorId,
        moderatedCount: row._count.moderatorId,
        email: moderator?.email ?? null,
        name: moderator?.name ?? null,
        role: moderator?.role ?? null,
        publicId: moderator?.publicId ?? null
      };
    });

    return NextResponse.json({
      pending: {
        total: pendingTotal,
        byEntity: pendingByEntity,
        oldest: oldestPending
          ? {
              id: oldestPending.id,
              entityType: oldestPending.entityType,
              entityId: oldestPending.entityId,
              field: oldestPending.field,
              createdAt: oldestPending.createdAt
            }
          : null
      },
      recentActivity: {
        approvalsLast7Days: approvalsLastWeek,
        rejectionsLast7Days: rejectionsLastWeek,
        topModerators,
        topContributors: topContributors
      },
      recentModeratedEdits
    });
  } catch (error) {
    console.error('Wiki admin overview error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}

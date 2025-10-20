export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';

async function getAuthenticatedUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) return null;

  const payload = verifyToken(sessionCookie.value);
  if (!payload) return null;

  return await prisma.user.findUnique({
    where: { id: payload.userId }
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['MODERATOR', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Moderator access required' },
        { status: 403 }
      );
    }

    const pendingEdits = await prisma.edit.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            editsAccepted: true,
            editsRejected: true,
            editsPending: true,
            publicId: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ edits: pendingEdits });

  } catch (error) {
    console.error('Get pending edits error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending edits' },
      { status: 500 }
    );
  }
}

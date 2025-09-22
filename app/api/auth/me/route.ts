import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { ensureUserPublicId } from '@/lib/wiki/publicId';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }

    const payload = verifyToken(sessionCookie.value);

    if (!payload) {
      return NextResponse.json({ user: null });
    }

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
        publicId: true
      }
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const publicId = user.publicId ?? (await ensureUserPublicId(prisma, user.id));

    const pendingCount = await prisma.edit.count({
      where: {
        userId: user.id,
        status: 'PENDING'
      }
    });

    if (pendingCount !== user.editsPending) {
      // Keep the cached counter in sync; best-effort only
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { editsPending: pendingCount }
        });
      } catch (updateError) {
        console.warn('Failed to sync editsPending counter', updateError);
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        publicId,
        editsPending: pendingCount
      }
    });

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null });
  }
}

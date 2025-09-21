import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';

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
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null });
  }
}

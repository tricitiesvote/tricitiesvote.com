import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/auth/csrf';

type AllowedRole = 'ADMIN';
const ALLOWED_ROLES: AllowedRole[] = ['ADMIN'];

async function getAuthenticatedAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) return null;

  const payload = verifyToken(sessionCookie.value);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!user || !ALLOWED_ROLES.includes(user.role as AllowedRole)) {
    return null;
  }

  return user;
}

function extractString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extractBoolean(value: unknown): boolean {
  return Boolean(value);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!validateCsrfToken(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 });
    }

    const body = await request.json();

    // Build update data
    const updateData: any = {};

    // Allow setting candidateId to null to unlink
    if ('candidateId' in body) {
      updateData.candidateId = body.candidateId === null ? null : extractString(body.candidateId);
    }
    if ('matchConfidence' in body) {
      updateData.matchConfidence = body.matchConfidence === null ? null : extractNumber(body.matchConfidence);
    }
    if ('manuallyReviewed' in body) {
      updateData.manuallyReviewed = extractBoolean(body.manuallyReviewed);
    }

    const enforcementCase = await prisma.enforcementCase.update({
      where: { id },
      data: updateData,
      select: {
        id: true
      }
    });

    return NextResponse.json({ case: enforcementCase });
  } catch (error) {
    console.error('Admin enforcement case PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update enforcement case' }, { status: 500 });
  }
}

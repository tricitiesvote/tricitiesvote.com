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
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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
      return NextResponse.json({ error: 'Response ID required' }, { status: 400 });
    }

    const body = await request.json();

    // Build update data
    const updateData: any = {};

    if ('value' in body) updateData.value = extractNumber(body.value);
    if ('comment' in body) updateData.comment = extractString(body.comment);
    if ('textResponse' in body) updateData.textResponse = extractString(body.textResponse);

    const response = await prisma.questionnaireResponse.update({
      where: { id },
      data: updateData,
      select: {
        id: true
      }
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Admin questionnaire response PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update response' }, { status: 500 });
  }
}

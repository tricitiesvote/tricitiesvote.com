import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/auth/csrf';

type AllowedRole = 'MODERATOR' | 'ADMIN';
const ALLOWED_ROLES: AllowedRole[] = ['MODERATOR', 'ADMIN'];

async function getAuthenticatedModerator(request: NextRequest) {
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

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value !== 'string') return fallback;
  const upper = value.toUpperCase() as T;
  return allowed.includes(upper) ? upper : fallback;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedModerator(request);
    if (!user) {
      return NextResponse.json({ error: 'Moderator access required' }, { status: 403 });
    }

    if (!validateCsrfToken(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Endorsement ID required' }, { status: 400 });
    }

    const body = await request.json();

    const updateData: any = {};

    if ('endorser' in body) updateData.endorser = extractString(body.endorser) || '';
    if ('url' in body) updateData.url = extractString(body.url);
    if ('sourceTitle' in body) updateData.sourceTitle = extractString(body.sourceTitle);
    if ('notes' in body) updateData.notes = extractString(body.notes);
    if ('type' in body) updateData.type = normalizeEnum(body.type, ['LETTER', 'SOCIAL', 'ORG'] as const, 'LETTER');
    if ('forAgainst' in body) updateData.forAgainst = normalizeEnum(body.forAgainst, ['FOR', 'AGAINST'] as const, 'FOR');

    const endorsement = await prisma.endorsement.update({
      where: { id },
      data: updateData,
      select: {
        id: true
      }
    });

    return NextResponse.json({ endorsement });
  } catch (error) {
    console.error('Admin endorsements PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update endorsement' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedModerator(request);
    if (!user) {
      return NextResponse.json({ error: 'Moderator access required' }, { status: 403 });
    }

    if (!validateCsrfToken(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Endorsement ID required' }, { status: 400 });
    }

    const endorsement = await prisma.endorsement.findUnique({
      where: { id },
      select: {
        id: true,
        filePath: true
      }
    });

    if (!endorsement) {
      return NextResponse.json({ error: 'Endorsement not found' }, { status: 404 });
    }

    if (endorsement.filePath) {
      const filePathAbsolute = path.join(process.cwd(), 'public', endorsement.filePath);
      try {
        await fs.unlink(filePathAbsolute);
      } catch (error) {
        // Ignore missing file errors
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(`Failed to delete endorsement file ${endorsement.filePath}`, error);
        }
      }
    }

    await prisma.endorsement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin endorsements DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete endorsement' }, { status: 500 });
  }
}

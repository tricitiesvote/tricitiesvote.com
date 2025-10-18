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

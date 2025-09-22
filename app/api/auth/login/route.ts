import { NextRequest, NextResponse } from 'next/server';
import { sendMagicLink } from '@/lib/auth/email';
import { generateMagicToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { generateUniquePublicId } from '@/lib/wiki/publicId';

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimiter = new Map<string, { count: number; windowStart: number }>();

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (request as any).ip ?? 'unknown';
}

function isRateLimited(request: NextRequest) {
  const key = getClientKey(request);
  const now = Date.now();
  const entry = rateLimiter.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimiter.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  rateLimiter.set(key, entry);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again shortly.' },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address required' },
        { status: 400 }
      );
    }

    // Generate magic token
    const token = generateMagicToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Find or create user
    const normalizedEmail = email.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          role: 'COMMUNITY',
          publicId: await generateUniquePublicId(prisma)
        }
      });
    } else if (!user.publicId) {
      const publicId = await generateUniquePublicId(prisma);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { publicId }
      });
    }

    // Create login token
    await prisma.loginToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // Send magic link email
    await sendMagicLink(email, token);

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}

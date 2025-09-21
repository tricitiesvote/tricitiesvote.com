import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth/jwt';
import { generateCsrfToken } from '@/lib/auth/csrf';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
    }

    // Find and validate login token
    const loginToken = await prisma.loginToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!loginToken || loginToken.used || loginToken.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // Mark token as used
    await prisma.loginToken.update({
      where: { id: loginToken.id },
      data: { used: true }
    });

    // Generate JWT session token
    const sessionToken = generateToken({
      userId: loginToken.user.id,
      email: loginToken.user.email,
      role: loginToken.user.role
    });

    // Create response and set cookies
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    const csrfToken = generateCsrfToken();
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}

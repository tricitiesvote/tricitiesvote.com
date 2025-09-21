import { randomBytes, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('csrf-token')?.value;
  const headerToken = request.headers.get('x-csrf-token');

  if (!cookieToken || !headerToken) {
    return false;
  }

  try {
    const cookieBuffer = Buffer.from(cookieToken, 'utf8');
    const headerBuffer = Buffer.from(headerToken, 'utf8');
    if (cookieBuffer.length !== headerBuffer.length) {
      return false;
    }
    return timingSafeEqual(cookieBuffer, headerBuffer);
  } catch (error) {
    return false;
  }
}

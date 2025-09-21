import jwt from 'jsonwebtoken';

const rawSecret = process.env.JWT_SECRET;

if (!rawSecret) {
  throw new Error('JWT_SECRET environment variable must be set');
}

const JWT_SECRET = rawSecret;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export function generateMagicToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

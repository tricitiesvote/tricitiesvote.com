import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { unslugify } from '@/lib/utils';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getAuthenticatedAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { slug } = params;
    const yearParam = request.nextUrl.searchParams.get('year');
    const year = yearParam ? Number.parseInt(yearParam, 10) : null;

    if (!year) {
      return NextResponse.json({ error: 'Year parameter required' }, { status: 400 });
    }

    const name = unslugify(slug);

    const candidate = await prisma.candidate.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        electionYear: year
      },
      include: {
        office: {
          select: {
            title: true
          }
        },
        endorsements: {
          orderBy: { createdAt: 'desc' }
        },
        questionnaireResponses: {
          include: {
            question: {
              include: {
                questionnaire: {
                  select: {
                    title: true
                  }
                }
              }
            }
          },
          orderBy: {
            question: {
              position: 'asc'
            }
          }
        },
        enforcementCases: {
          where: {
            opened: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`)
            }
          },
          orderBy: { opened: 'desc' }
        }
      }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error('Admin candidate GET error:', error);
    return NextResponse.json({ error: 'Failed to load candidate' }, { status: 500 });
  }
}

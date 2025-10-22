import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { slugify } from '@/lib/utils';

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

function serializeEndorsement(endorsement: Awaited<ReturnType<typeof fetchEndorsement>>) {
  if (!endorsement) return null;

  return {
    id: endorsement.id,
    endorser: endorsement.endorser,
    url: endorsement.url,
    filePath: endorsement.filePath,
    sourceTitle: endorsement.sourceTitle,
    notes: endorsement.notes,
    type: endorsement.type,
    forAgainst: endorsement.forAgainst,
    createdAt: endorsement.createdAt.toISOString(),
    candidate: endorsement.candidate
      ? {
          id: endorsement.candidate.id,
          name: endorsement.candidate.name,
          electionYear: endorsement.candidate.electionYear
        }
      : null
  };
}

async function fetchEndorsement(id: string) {
  return prisma.endorsement.findUnique({
    where: { id },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          electionYear: true
        }
      }
    }
  });
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value !== 'string') return fallback;
  const upper = value.toUpperCase() as T;
  return allowed.includes(upper) ? upper : fallback;
}

function extractString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ensureUploadsDir(year: number) {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'endorsements', String(year));
  await fs.mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedModerator(request);
    if (!user) {
      return NextResponse.json({ error: 'Moderator access required' }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const yearParam = params.get('year');
    const year = yearParam ? Number.parseInt(yearParam, 10) : undefined;

    const [endorsements, candidates] = await Promise.all([
      prisma.endorsement.findMany({
        where: year
          ? {
              candidate: {
                electionYear: year
              }
            }
          : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              electionYear: true
            }
          }
        }
      }),
      prisma.candidate.findMany({
        where: year
          ? { electionYear: year }
          : {
              electionYear: {
                gte: new Date().getFullYear() - 1
              }
            },
        orderBy: [
          { electionYear: 'desc' },
          { name: 'asc' }
        ],
        select: {
          id: true,
          name: true,
          electionYear: true
        }
      })
    ]);

    return NextResponse.json({
      endorsements: endorsements.map(serializeEndorsement),
      candidates
    });
  } catch (error) {
    console.error('Admin endorsements GET error:', error);
    return NextResponse.json({ error: 'Failed to load endorsements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedModerator(request);
    if (!user) {
      return NextResponse.json({ error: 'Moderator access required' }, { status: 403 });
    }

    if (!validateCsrfToken(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      return await handleFileUpload(request);
    }

    const payload = await request.json();
    return await handleUrlEndorsement(payload);
  } catch (error) {
    console.error('Admin endorsements POST error:', error);
    return NextResponse.json({ error: 'Failed to create endorsement' }, { status: 500 });
  }
}

async function handleUrlEndorsement(body: any) {
  const candidateId = extractString(body?.candidateId);
  const endorser = extractString(body?.endorser);
  const url = extractString(body?.url);

  if (!candidateId) {
    return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
  }
  if (!endorser) {
    return NextResponse.json({ error: 'Endorser name is required' }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: 'URL is required for link endorsements' }, { status: 400 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true }
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  const type = normalizeEnum(body?.type, ['LETTER', 'SOCIAL', 'ORG'] as const, 'LETTER');
  const forAgainst = normalizeEnum(body?.forAgainst, ['FOR', 'AGAINST'] as const, 'FOR');
  const sourceTitle = extractString(body?.sourceTitle);
  const notes = extractString(body?.notes);

  const endorsement = await prisma.endorsement.create({
    data: {
      candidateId,
      endorser,
      url,
      filePath: null,
      sourceTitle,
      notes,
      type,
      forAgainst
    },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          electionYear: true
        }
      }
    }
  });

  return NextResponse.json({ endorsement: serializeEndorsement(endorsement) });
}

async function handleFileUpload(request: NextRequest) {
  const formData = await request.formData();
  const candidateId = extractString(formData.get('candidateId'));
  const endorser = extractString(formData.get('endorser'));
  const sourceTitle = extractString(formData.get('sourceTitle'));
  const notes = extractString(formData.get('notes'));
  const url = extractString(formData.get('url'));
  const file = formData.get('file');

  if (!candidateId) {
    return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
  }
  if (!endorser) {
    return NextResponse.json({ error: 'Endorser name is required' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File upload is required' }, { status: 400 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, electionYear: true }
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  const type = normalizeEnum(formData.get('type'), ['LETTER', 'SOCIAL', 'ORG'] as const, 'LETTER');
  const forAgainst = normalizeEnum(formData.get('forAgainst'), ['FOR', 'AGAINST'] as const, 'FOR');

  const uploadsDir = await ensureUploadsDir(candidate.electionYear);
  const originalName = file.name || 'endorsement';
  const ext = path.extname(originalName) || '.pdf';
  const base = slugify(`${endorser}-${Date.now()}`);
  const fileName = `${base}${ext}`;
  const filePathRelative = `/uploads/endorsements/${candidate.electionYear}/${fileName}`;
  const filePathAbsolute = path.join(uploadsDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePathAbsolute, buffer);

  const endorsement = await prisma.endorsement.create({
    data: {
      candidateId,
      endorser,
      url: url ?? null,
      filePath: filePathRelative,
      sourceTitle,
      notes,
      type,
      forAgainst
    },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          electionYear: true
        }
      }
    }
  });

  return NextResponse.json({ endorsement: serializeEndorsement(endorsement) });
}

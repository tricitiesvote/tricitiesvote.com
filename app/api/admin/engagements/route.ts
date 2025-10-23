import { NextRequest, NextResponse } from 'next/server';
import { Prisma, ElectionType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { slugify } from '@/lib/utils';
import { CURRENT_ELECTION_YEAR } from '@/lib/constants';

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

function normalizeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

async function generateUniqueSlug(title: string, date: Date | null) {
  const datePart = date ? date.toISOString().slice(0, 10) : '';
  const baseInput = `${datePart} ${title}`.trim() || 'engagement';
  let base = slugify(baseInput);
  if (!base) {
    base = `engagement-${Date.now()}`;
  }

  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.engagement.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });
    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

function serializeEngagement(engagement: Prisma.EngagementGetPayload<{
  include: {
    race: {
      include: {
        office: true
        Guide: {
          include: {
            region: true
          }
        }
      }
    }
    participants: {
      include: {
        candidate: {
          select: {
            id: true
            name: true
            electionYear: true
            office: {
              select: {
                title: true
              }
            }
          }
        }
      }
    }
  }
}>) {
  return {
    id: engagement.id,
    slug: engagement.slug,
    title: engagement.title,
    date: engagement.date,
    linkType: engagement.linkType,
    primaryLink: engagement.primaryLink,
    secondaryLink: engagement.secondaryLink,
    secondaryLinkTitle: engagement.secondaryLinkTitle,
    notes: engagement.notes,
    race: engagement.race
      ? {
          id: engagement.race.id,
          electionYear: engagement.race.electionYear,
          officeTitle: engagement.race.office.title,
          regionName: engagement.race.Guide?.[0]?.region.name ?? null
        }
      : null,
    participants: engagement.participants.map((participant) => ({
      candidateId: participant.candidateId,
      participated: participant.participated,
      notes: participant.notes,
      link: participant.link,
      candidate: participant.candidate
        ? {
            id: participant.candidate.id,
            name: participant.candidate.name,
            electionYear: participant.candidate.electionYear,
            officeTitle: participant.candidate.office?.title ?? null
          }
        : null
    }))
  };
}

function serializeRace(
  race: Prisma.RaceGetPayload<{
    include: {
      office: true
      Guide: {
        include: {
          region: true
        }
      }
      candidates: {
        include: {
          candidate: {
            select: {
              id: true
              name: true
              electionYear: true
            }
          }
        }
      }
    }
  }>
) {
  return {
    id: race.id,
    electionYear: race.electionYear,
    officeTitle: race.office.title,
    regionName: race.Guide?.[0]?.region.name ?? null,
    candidates: race.candidates
      .map((candidateRelation) => ({
        id: candidateRelation.candidate.id,
        name: candidateRelation.candidate.name,
        electionYear: candidateRelation.candidate.electionYear
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedModerator(request);
    if (!user) {
      return NextResponse.json({ error: 'Moderator access required' }, { status: 403 });
    }

    const [engagements, races] = await Promise.all([
      prisma.engagement.findMany({
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          race: {
            include: {
              office: true,
              Guide: {
                include: {
                  region: true
                }
              }
            }
          },
          participants: {
            include: {
              candidate: {
                select: {
                  id: true,
                  name: true,
                  electionYear: true,
                  office: {
                    select: {
                      title: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.race.findMany({
        where: {
          type: ElectionType.GENERAL,
          electionYear: CURRENT_ELECTION_YEAR
        },
        orderBy: [
          { office: { title: 'asc' } }
        ],
        include: {
          office: true,
          Guide: {
            include: {
              region: true
            }
          },
          candidates: {
            include: {
              candidate: {
                select: {
                  id: true,
                  name: true,
                  electionYear: true
                }
              }
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      engagements: engagements.map(serializeEngagement),
      races: races.map(serializeRace)
    });
  } catch (error) {
    console.error('Admin engagements GET error:', error);
    return NextResponse.json({ error: 'Failed to load engagements' }, { status: 500 });
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

    const payload = await request.json();
    const {
      title,
      date,
      linkType,
      primaryLink,
      secondaryLink,
      secondaryLinkTitle,
      notes,
      raceId,
      participants
    } = payload ?? {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let dateValue: Date | null = null;
    if (date !== undefined) {
      dateValue = normalizeDate(date);
    }

    if (date !== undefined && dateValue === null && date) {
      return NextResponse.json(
        { error: 'Date must be a valid ISO string or omitted' },
        { status: 400 }
      );
    }

    if (raceId && typeof raceId === 'string') {
      const raceExists = await prisma.race.findUnique({
        where: { id: raceId },
        select: { id: true }
      });

      if (!raceExists) {
        return NextResponse.json({ error: 'Race not found' }, { status: 404 });
      }
    }

    const slug = await generateUniqueSlug(title, dateValue);

    const participantRecords: Array<{
      candidateId: string;
      participated: boolean;
      notes?: string;
      link?: string;
    }> = Array.isArray(participants)
      ? participants
          .filter(
            (participant: any) =>
              participant &&
              typeof participant.candidateId === 'string' &&
              participant.candidateId.trim()
          )
          .map((participant: any) => ({
            candidateId: participant.candidateId,
            participated: Boolean(participant.participated),
            notes:
              typeof participant.notes === 'string' && participant.notes.trim()
                ? participant.notes.trim()
                : undefined,
            link:
              typeof participant.link === 'string' && participant.link.trim()
                ? participant.link.trim()
                : undefined
          }))
      : [];

    if (participantRecords.length > 0) {
      const candidateIds = participantRecords.map((record) => record.candidateId);
      const candidates = await prisma.candidate.findMany({
        where: { id: { in: candidateIds } },
        select: { id: true }
      });

      const missing = candidateIds.filter(
        (candidateId) => !candidates.find((candidate) => candidate.id === candidateId)
      );

      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Candidate(s) not found: ${missing.join(', ')}` },
          { status: 404 }
        );
      }
    }

    const engagement = await prisma.$transaction(async (tx) => {
      const created = await tx.engagement.create({
        data: {
          slug,
          title: title.trim(),
          date: dateValue,
          linkType: linkType === 'PER_CANDIDATE' ? 'PER_CANDIDATE' : 'SHARED',
          primaryLink: typeof primaryLink === 'string' && primaryLink.trim() ? primaryLink.trim() : null,
          secondaryLink:
            typeof secondaryLink === 'string' && secondaryLink.trim() ? secondaryLink.trim() : null,
          secondaryLinkTitle:
            typeof secondaryLinkTitle === 'string' && secondaryLinkTitle.trim()
              ? secondaryLinkTitle.trim()
              : null,
          notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
          raceId: typeof raceId === 'string' && raceId.trim() ? raceId : null
        }
      });

      if (participantRecords.length > 0) {
        await tx.candidateEngagement.createMany({
          data: participantRecords.map((record) => ({
            engagementId: created.id,
            candidateId: record.candidateId,
            participated: record.participated,
            notes: record.notes ?? null,
            link: record.link ?? null
          })),
          skipDuplicates: true
        });
      }

      return created;
    });

    const fullRecord = await prisma.engagement.findUnique({
      where: { id: engagement.id },
      include: {
        race: {
          include: {
            office: true,
            Guide: {
              include: {
                region: true
              }
            }
          }
        },
        participants: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                electionYear: true,
                office: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      engagement: fullRecord ? serializeEngagement(fullRecord) : null
    });
  } catch (error) {
    console.error('Admin engagements POST error:', error);
    return NextResponse.json({ error: 'Failed to create engagement' }, { status: 500 });
  }
}

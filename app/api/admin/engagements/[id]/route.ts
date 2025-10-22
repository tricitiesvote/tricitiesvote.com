import { NextRequest, NextResponse } from 'next/server';
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

function serializeEngagement(record: Awaited<ReturnType<typeof fetchEngagement>>) {
  if (!record) return null;

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    date: record.date,
    linkType: record.linkType,
    primaryLink: record.primaryLink,
    secondaryLink: record.secondaryLink,
    secondaryLinkTitle: record.secondaryLinkTitle,
    notes: record.notes,
    race: record.race
      ? {
          id: record.race.id,
          electionYear: record.race.electionYear,
          officeTitle: record.race.office.title,
          regionName: record.race.Guide?.[0]?.region.name ?? null
        }
      : null,
    participants: record.participants.map((participant) => ({
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

async function fetchEngagement(id: string) {
  return prisma.engagement.findUnique({
    where: { id },
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
      return NextResponse.json({ error: 'Engagement ID required' }, { status: 400 });
    }

    const existing = await prisma.engagement.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
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

    const updateData: any = {};

    if (typeof title === 'string') {
      if (!title.trim()) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (date !== undefined) {
      const parsedDate = normalizeDate(date);
      if (date && parsedDate === null) {
        return NextResponse.json(
          { error: 'Date must be a valid ISO string or omitted' },
          { status: 400 }
        );
      }
      updateData.date = parsedDate;
    }

    if (linkType !== undefined) {
      updateData.linkType = linkType === 'PER_CANDIDATE' ? 'PER_CANDIDATE' : 'SHARED';
    }

    if (primaryLink !== undefined) {
      updateData.primaryLink =
        typeof primaryLink === 'string' && primaryLink.trim() ? primaryLink.trim() : null;
    }

    if (secondaryLink !== undefined) {
      updateData.secondaryLink =
        typeof secondaryLink === 'string' && secondaryLink.trim() ? secondaryLink.trim() : null;
    }

    if (secondaryLinkTitle !== undefined) {
      updateData.secondaryLinkTitle =
        typeof secondaryLinkTitle === 'string' && secondaryLinkTitle.trim()
          ? secondaryLinkTitle.trim()
          : null;
    }

    if (notes !== undefined) {
      updateData.notes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;
    }

    if (raceId !== undefined) {
      if (raceId === null || raceId === '') {
        updateData.raceId = null;
      } else if (typeof raceId === 'string') {
        const raceExists = await prisma.race.findUnique({
          where: { id: raceId },
          select: { id: true }
        });

        if (!raceExists) {
          return NextResponse.json({ error: 'Race not found' }, { status: 404 });
        }

        updateData.raceId = raceId;
      }
    }

    let participantRecords:
      | Array<{
          candidateId: string;
          participated: boolean;
          notes?: string;
          link?: string;
        }>
      | null = null;

    if (participants !== undefined) {
      if (!Array.isArray(participants)) {
        return NextResponse.json({ error: 'Participants must be an array' }, { status: 400 });
      }

      participantRecords = participants
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
        }));

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
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.engagement.update({
          where: { id },
          data: updateData
        });
      }

      if (participantRecords) {
        await tx.candidateEngagement.deleteMany({
          where: { engagementId: id }
        });

        if (participantRecords.length > 0) {
          await tx.candidateEngagement.createMany({
            data: participantRecords.map((record) => ({
              engagementId: id,
              candidateId: record.candidateId,
              participated: record.participated,
              notes: record.notes ?? null,
              link: record.link ?? null
            })),
            skipDuplicates: true
          });
        }
      }
    });

    const fullRecord = await fetchEngagement(id);
    return NextResponse.json({ engagement: serializeEngagement(fullRecord) });
  } catch (error) {
    console.error('Admin engagements PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update engagement' }, { status: 500 });
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
      return NextResponse.json({ error: 'Engagement ID required' }, { status: 400 });
    }

    const existing = await prisma.engagement.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }

    await prisma.engagement.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin engagements DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete engagement' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { verifyToken } from '@/lib/auth/jwt';
import { sendEditStatusNotification } from '@/lib/auth/email';
import { prisma } from '@/lib/db';
import {
  candidateEditableFieldSet,
  raceEditableFieldSet,
  officeEditableFieldSet,
  guideEditableFieldSet
} from '@/lib/wiki/fields';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/utils';

async function getAuthenticatedUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) return null;

  const payload = verifyToken(sessionCookie.value);
  if (!payload) return null;

  return await prisma.user.findUnique({
    where: { id: payload.userId }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const edit = await prisma.edit.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        moderator: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!edit) {
      return NextResponse.json(
        { error: 'Edit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ edit });

  } catch (error) {
    console.error('Get edit error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch edit' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['MODERATOR', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Moderator access required' },
        { status: 403 }
      );
    }

    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const { status, moderatorNote } = await request.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const edit = await prisma.edit.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!edit) {
      return NextResponse.json(
        { error: 'Edit not found' },
        { status: 404 }
      );
    }

    if (edit.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Edit is not pending review' },
        { status: 409 }
      );
    }

    if (status === 'APPROVED') {
      if (
        edit.entityType === 'CANDIDATE' &&
        !candidateEditableFieldSet.has(edit.field as any)
      ) {
        return NextResponse.json(
          { error: `Field ${edit.field} is not supported for wiki overrides.` },
          { status: 400 }
        );
      }

      if (
        edit.entityType === 'RACE' &&
        !raceEditableFieldSet.has(edit.field as any)
      ) {
        return NextResponse.json(
          { error: `Field ${edit.field} is not supported for race overrides.` },
          { status: 400 }
        );
      }

      if (
        edit.entityType === 'OFFICE' &&
        !officeEditableFieldSet.has(edit.field as any)
      ) {
        return NextResponse.json(
          { error: `Field ${edit.field} is not supported for office overrides.` },
          { status: 400 }
        );
      }

      if (
        edit.entityType === 'GUIDE' &&
        !guideEditableFieldSet.has(edit.field as any)
      ) {
        return NextResponse.json(
          { error: `Field ${edit.field} is not supported for guide overrides.` },
          { status: 400 }
        );
      }
    }

    const normalizedNewValue = typeof edit.newValue === 'string'
      ? edit.newValue
      : JSON.stringify(edit.newValue);

    // Update edit status
    const updatedEdit = await prisma.edit.update({
      where: { id: params.id },
      data: {
        status,
        moderatorId: user.id,
        moderatorNote,
        reviewedAt: new Date(),
        appliedAt: status === 'APPROVED' ? new Date() : null
      }
    });

    // Update user's edit counts
    const nextPendingCount = Math.max((edit.user?.editsPending ?? 1) - 1, 0);
    const userUpdate: any = { editsPending: { set: nextPendingCount } };
    if (status === 'APPROVED') {
      userUpdate.editsAccepted = { increment: 1 };

      // Apply the edit to the actual data
      if (edit.entityType === 'CANDIDATE') {
        // Special handling for engagement participation
        if (edit.field === 'engagements') {
          try {
            const participants = JSON.parse(normalizedNewValue) as Array<{
              engagementId: string;
              participated: boolean;
              link?: string;
            }>;

            // Delete all existing engagement records for this candidate
            await prisma.candidateEngagement.deleteMany({
              where: { candidateId: edit.entityId }
            });

            // Create new records
            if (participants.length > 0) {
              await prisma.candidateEngagement.createMany({
                data: participants.map(p => ({
                  candidateId: edit.entityId,
                  engagementId: p.engagementId,
                  participated: p.participated,
                  link: p.link || null,
                  notes: null
                })),
                skipDuplicates: true
              });
            }
          } catch (err) {
            console.error('Failed to apply engagement changes:', err);
            throw new Error('Failed to parse or apply engagement data');
          }
        } else {
          // Standard wiki field update
          const wikiField = `${edit.field}Wiki`;
          await prisma.candidate.update({
            where: { id: edit.entityId },
            data: { [wikiField]: normalizedNewValue }
          });
        }

        await revalidateCandidateContent(edit.entityId);
      } else if (edit.entityType === 'RACE') {
        const wikiField = `${edit.field}Wiki`;
        await prisma.race.update({
          where: { id: edit.entityId },
          data: { [wikiField]: normalizedNewValue }
        });

        await revalidateRaceContent(edit.entityId);
      } else if (edit.entityType === 'OFFICE') {
        const wikiField = `${edit.field}Wiki`;
        await prisma.office.update({
          where: { id: edit.entityId },
          data: { [wikiField]: normalizedNewValue }
        });

        await revalidateOfficeContent(edit.entityId);
      } else if (edit.entityType === 'GUIDE') {
        const wikiField = `${edit.field}Wiki`;
        await prisma.guide.update({
          where: { id: edit.entityId },
          data: { [wikiField]: normalizedNewValue }
        });

        await revalidateGuideContent(edit.entityId);
      } else if (edit.entityType === 'ENDORSEMENT') {
        try {
          const payload = JSON.parse(normalizedNewValue) as {
            endorser?: string;
            url?: string | null;
            filePath?: string | null;
            sourceTitle?: string | null;
            notes?: string | null;
            type?: string | null;
            forAgainst?: string | null;
          };

          const endorser = payload.endorser?.trim();
          if (!endorser) {
            throw new Error('Missing endorser name');
          }

          const candidateRecord = await prisma.candidate.findUnique({
            where: { id: edit.entityId },
            select: { electionYear: true }
          });

          if (!candidateRecord) {
            throw new Error('Candidate not found when applying endorsement');
          }

          const normalizedType = (payload.type || 'LETTER').toUpperCase();
          const type = ['LETTER', 'SOCIAL', 'ORG'].includes(normalizedType)
            ? (normalizedType as 'LETTER' | 'SOCIAL' | 'ORG')
            : 'LETTER';

          const normalizedForAgainst = (payload.forAgainst || 'FOR').toUpperCase();
          const forAgainst = normalizedForAgainst === 'AGAINST' ? 'AGAINST' : 'FOR';

          let finalFilePath: string | null = payload.filePath && payload.filePath.trim() ? payload.filePath.trim() : null;

          if (finalFilePath && finalFilePath.includes('/uploads/endorsements/pending/')) {
            const pendingAbsolute = path.join(process.cwd(), 'public', finalFilePath);
            const exists = await fs
              .access(pendingAbsolute)
              .then(() => true)
              .catch(() => false);

            if (exists) {
              const targetDir = path.join(
                process.cwd(),
                'public',
                'uploads',
                'endorsements',
                String(candidateRecord.electionYear)
              );
              await fs.mkdir(targetDir, { recursive: true });

              const fileName = path.basename(finalFilePath);
              let finalAbsolute = path.join(targetDir, fileName);
              let finalRelative = `/uploads/endorsements/${candidateRecord.electionYear}/${fileName}`;

              // Avoid collisions if another file with same name exists
              let counter = 1;
              while (
                await fs
                  .access(finalAbsolute)
                  .then(() => true)
                  .catch(() => false)
              ) {
                const parsed = path.parse(fileName);
                const candidateName = `${parsed.name}-${counter}${parsed.ext}`;
                finalAbsolute = path.join(targetDir, candidateName);
                finalRelative = `/uploads/endorsements/${candidateRecord.electionYear}/${candidateName}`;
                counter += 1;
              }

              await fs.rename(pendingAbsolute, finalAbsolute);
              finalFilePath = finalRelative;
            }
          }

          await prisma.endorsement.create({
            data: {
              candidateId: edit.entityId,
              endorser,
              url: payload.url && payload.url.trim() ? payload.url.trim() : null,
              filePath: finalFilePath,
              sourceTitle: payload.sourceTitle && payload.sourceTitle.trim() ? payload.sourceTitle.trim() : null,
              notes: payload.notes && payload.notes.trim() ? payload.notes.trim() : null,
              type,
              forAgainst
            }
          });

          await revalidateCandidateContent(edit.entityId);
        } catch (err) {
          console.error('Failed to apply endorsement edit:', err);
          throw new Error('Failed to apply endorsement changes');
        }
      }

    } else {
      userUpdate.editsRejected = { increment: 1 };
    }

    await prisma.user.update({
      where: { id: edit.userId },
      data: userUpdate
    });

    // Send notification email
    try {
      await sendEditStatusNotification(
        edit.user.email,
        status === 'APPROVED' ? 'approved' : 'rejected',
        edit.field,
        moderatorNote
      );
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    return NextResponse.json({ edit: updatedEdit, success: true });

  } catch (error) {
    console.error('Update edit error:', error);
    return NextResponse.json(
      { error: 'Failed to update edit' },
      { status: 500 }
    );
  }
}

async function revalidateCandidateContent(candidateId: string) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: {
        name: true,
        electionYear: true,
        races: {
          select: {
            race: {
              select: {
                id: true,
                electionYear: true,
                office: { select: { title: true } },
                Guide: {
                  select: {
                    region: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!candidate) return;

    const candidateSlug = slugify(candidate.name);
    revalidatePath('/');
    revalidatePath(`/${candidate.electionYear}`);
    revalidatePath(`/${candidate.electionYear}/candidate/${candidateSlug}`);

    const seen = new Set<string>();
    for (const raceRelation of candidate.races) {
      const race = raceRelation.race;
      if (!race) continue;
      const raceSlug = slugify(race.office.title);
      if (!seen.has(raceSlug)) {
        revalidatePath(`/${race.electionYear}/race/${raceSlug}`);
        revalidatePath(`/${race.electionYear}/compare/${raceSlug}`);
        seen.add(raceSlug);
      }

      const guide = race.Guide?.[0];
      if (guide) {
        const guideSlug = slugify(guide.region.name);
        revalidatePath(`/${race.electionYear}/guide/${guideSlug}`);
      }
    }
  } catch (error) {
    console.error('Failed to revalidate candidate paths', error);
  }
}

async function revalidateRaceContent(raceId: string) {
  try {
    const race = await prisma.race.findUnique({
      where: { id: raceId },
      select: {
        electionYear: true,
        office: { select: { title: true } },
        Guide: {
          select: { region: { select: { name: true } } }
        }
      }
    });

    if (!race) return;

    const raceSlug = slugify(race.office.title);
    revalidatePath('/');
    revalidatePath(`/${race.electionYear}`);
    revalidatePath(`/${race.electionYear}/race/${raceSlug}`);
    revalidatePath(`/${race.electionYear}/compare/${raceSlug}`);

    const guide = race.Guide?.[0];
    if (guide) {
      const guideSlug = slugify(guide.region.name);
      revalidatePath(`/${race.electionYear}/guide/${guideSlug}`);
    }
  } catch (error) {
    console.error('Failed to revalidate race paths', error);
  }
}

async function revalidateOfficeContent(officeId: string) {
  try {
    const office = await prisma.office.findUnique({
      where: { id: officeId },
      select: {
        title: true,
        region: { select: { name: true } },
        races: {
          select: {
            id: true,
            electionYear: true,
            office: { select: { title: true } },
            Guide: {
              select: { region: { select: { name: true } } }
            }
          }
        }
      }
    });

    if (!office) return;

    revalidatePath('/');

    const seen = new Set<string>();
    for (const race of office.races) {
      const raceSlug = slugify(race.office.title);
      if (!seen.has(raceSlug)) {
        revalidatePath(`/${race.electionYear}`);
        revalidatePath(`/${race.electionYear}/race/${raceSlug}`);
        revalidatePath(`/${race.electionYear}/compare/${raceSlug}`);
        seen.add(raceSlug);
      }

      const guide = race.Guide?.[0];
      if (guide) {
        const guideSlug = slugify(guide.region.name);
        revalidatePath(`/${race.electionYear}/guide/${guideSlug}`);
      }
    }
  } catch (error) {
    console.error('Failed to revalidate office paths', error);
  }
}

async function revalidateGuideContent(guideId: string) {
  try {
    const guide = await prisma.guide.findUnique({
      where: { id: guideId },
      select: {
        electionYear: true,
        region: { select: { name: true } }
      }
    });

    if (!guide) return;

    const guideSlug = slugify(guide.region.name);
    revalidatePath('/');
    revalidatePath(`/${guide.electionYear}`);
    revalidatePath(`/${guide.electionYear}/guide/${guideSlug}`);
  } catch (error) {
    console.error('Failed to revalidate guide paths', error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { calculateTrustLevel } from '@/lib/auth/trust';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { prisma } from '@/lib/db';
import {
  candidateEditableFieldSet,
  raceEditableFieldSet,
  officeEditableFieldSet,
  guideEditableFieldSet
} from '@/lib/wiki/fields';

async function getAuthenticatedUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) return null;

  const payload = verifyToken(sessionCookie.value);
  if (!payload) return null;

  return await prisma.user.findUnique({
    where: { id: payload.userId }
  });
}

export async function GET(request: NextRequest) {
  try {
    const viewer = await getAuthenticatedUser(request);
    const canViewEmails = Boolean(viewer && ['MODERATOR', 'ADMIN'].includes(viewer.role));

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;

    const edits = await prisma.edit.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            publicId: true,
            editsAccepted: true,
            editsRejected: true
          }
        },
        moderator: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            publicId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const sanitized = edits.map((edit) => ({
      ...edit,
      user: edit.user
        ? {
            ...edit.user,
            email: canViewEmails ? edit.user.email : null
          }
        : null,
      moderator: edit.moderator
        ? {
            ...edit.moderator,
            email: canViewEmails ? edit.moderator.email : null
          }
        : null
    }));

    return NextResponse.json({
      edits: sanitized,
      viewerRole: viewer?.role ?? null
    });

  } catch (error) {
    console.error('Get edits error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch edits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const { entityType, entityId, field, newValue, rationale } = await request.json();

    if (!entityType || !entityId || !field || typeof rationale !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof newValue === 'undefined') {
      return NextResponse.json(
        { error: 'New value is required' },
        { status: 400 }
      );
    }

    if (!rationale.trim()) {
      return NextResponse.json(
        { error: 'Please include a rationale for this change' },
        { status: 400 }
      );
    }

    if (!['CANDIDATE', 'RACE', 'OFFICE', 'GUIDE'].includes(entityType)) {
      return NextResponse.json(
        { error: 'Editing this entity type is not supported yet.' },
        { status: 400 }
      );
    }

    if (entityType === 'CANDIDATE' && !candidateEditableFieldSet.has(field as any)) {
      return NextResponse.json(
        { error: `Editing the ${field} field is not supported.` },
        { status: 400 }
      );
    }

    if (entityType === 'RACE' && !raceEditableFieldSet.has(field as any)) {
      return NextResponse.json(
        { error: `Editing the ${field} field is not supported for races.` },
        { status: 400 }
      );
    }

    if (entityType === 'OFFICE' && !officeEditableFieldSet.has(field as any)) {
      return NextResponse.json(
        { error: `Editing the ${field} field is not supported for offices.` },
        { status: 400 }
      );
    }

    if (entityType === 'GUIDE' && !guideEditableFieldSet.has(field as any)) {
      return NextResponse.json(
        { error: `Editing the ${field} field is not supported for guides.` },
        { status: 400 }
      );
    }

    const normalizedNewValue = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);

    // Check trust level and rate limiting
    const trustLevel = calculateTrustLevel(user);
    if (!trustLevel.canEdit) {
      return NextResponse.json(
        { error: `You have reached your pending edit limit (${trustLevel.maxPendingEdits}). Please wait for your current edits to be reviewed.` },
        { status: 429 }
      );
    }

    // Check if user already has pending edit for this field
    const existingEdit = await prisma.edit.findFirst({
      where: {
        userId: user.id,
        entityType,
        entityId,
        field,
        status: 'PENDING'
      }
    });

    if (existingEdit) {
      return NextResponse.json(
        { error: 'You already have a pending edit for this field' },
        { status: 409 }
      );
    }

    // Get current value for comparison
    let oldValue = null;
    try {
      if (entityType === 'CANDIDATE') {
        const candidate = await prisma.candidate.findUnique({
          where: { id: entityId }
        });
        if (candidate) {
          const wikiKey = `${field}Wiki` as keyof typeof candidate;
          const wikiValue = (candidate as any)[wikiKey];
          if (wikiValue !== undefined && wikiValue !== null && wikiValue !== '') {
            oldValue = wikiValue;
          } else {
            oldValue = (candidate as any)[field];
          }
        }
      } else if (entityType === 'RACE') {
        const race = await prisma.race.findUnique({
          where: { id: entityId }
        });
        if (race) {
          const wikiKey = `${field}Wiki` as keyof typeof race;
          const wikiValue = (race as any)[wikiKey];
          if (wikiValue !== undefined && wikiValue !== null && wikiValue !== '') {
            oldValue = wikiValue;
          } else {
            oldValue = (race as any)[field];
          }
        }
      } else if (entityType === 'OFFICE') {
        const office = await prisma.office.findUnique({
          where: { id: entityId }
        });
        if (office) {
          const wikiKey = `${field}Wiki` as keyof typeof office;
          const wikiValue = (office as any)[wikiKey];
          if (wikiValue !== undefined && wikiValue !== null && wikiValue !== '') {
            oldValue = wikiValue;
          } else {
            oldValue = (office as any)[field];
          }
        }
      } else if (entityType === 'GUIDE') {
        const guide = await prisma.guide.findUnique({
          where: { id: entityId }
        });
        if (guide) {
          const wikiKey = `${field}Wiki` as keyof typeof guide;
          const wikiValue = (guide as any)[wikiKey];
          if (wikiValue !== undefined && wikiValue !== null && wikiValue !== '') {
            oldValue = wikiValue;
          } else {
            oldValue = (guide as any)[field];
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch old value:', error);
    }

    if (typeof oldValue === 'string' && oldValue === normalizedNewValue) {
      return NextResponse.json(
        { error: 'No changes detected' },
        { status: 400 }
      );
    }

    // Create the edit
    const edit = await prisma.edit.create({
      data: {
        userId: user.id,
        entityType,
        entityId,
        field,
        oldValue,
        newValue: normalizedNewValue,
        rationale
      }
    });

    // Update user's pending edit count
    await prisma.user.update({
      where: { id: user.id },
      data: { editsPending: { increment: 1 } }
    });

    return NextResponse.json({ edit, success: true });

  } catch (error) {
    console.error('Create edit error:', error);
    return NextResponse.json(
      { error: 'Failed to create edit' },
      { status: 500 }
    );
  }
}

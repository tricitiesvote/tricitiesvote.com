// @ts-nocheck
import { Prisma, EditStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';

export const EDIT_INCLUDE = {
  user: {
    select: {
      id: true,
      publicId: true,
      role: true,
      editsAccepted: true,
      editsRejected: true
    }
  },
  moderator: {
    select: {
      id: true,
      publicId: true,
      role: true
    }
  }
} satisfies Prisma.EditInclude;

export type EditWithRelations = Prisma.EditGetPayload<{ include: typeof EDIT_INCLUDE }>;

const STATUS_LABEL_MAP: Record<string, EditStatus> = {
  accepted: 'APPROVED',
  pending: 'PENDING',
  declined: 'REJECTED'
};

function mapStatusParam(status?: string): EditStatus | undefined {
  if (!status) return undefined;
  return STATUS_LABEL_MAP[status.toLowerCase() as keyof typeof STATUS_LABEL_MAP];
}

export async function getUserEditHistory(params: {
  publicId: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { publicId, status, page = 1, pageSize = 20 } = params;
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const user = await prisma.user.findUnique({
    where: { publicId },
    select: {
      id: true,
      publicId: true,
      email: true,
      name: true,
      role: true,
      editsAccepted: true,
      editsRejected: true,
      editsPending: true,
      createdAt: true
    }
  });

  if (!user) {
    return null;
  }

  const statusFilter = mapStatusParam(status);
  const baseWhere: Prisma.EditWhereInput = { userId: user.id };

  const counts = await prisma.edit.groupBy({
    by: ['status'],
    where: baseWhere,
    _count: { _all: true }
  });

  const countMap: Record<EditStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    APPLIED: 0,
    SUPERSEDED: 0
  };

  for (const row of counts) {
    countMap[row.status] = row._count._all;
  }

  const totalSubmitted = Object.values(countMap).reduce((sum, value) => sum + value, 0);

  const pinnedEdits = statusFilter || countMap.PENDING === 0
    ? []
    : await prisma.edit.findMany({
        where: { ...baseWhere, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: EDIT_INCLUDE
      });

  const pagedWhere: Prisma.EditWhereInput = statusFilter
    ? { ...baseWhere, status: statusFilter }
    : { ...baseWhere, NOT: { status: 'PENDING' } };

  const total = await prisma.edit.count({ where: pagedWhere });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(normalizedPage, totalPages);

  const edits = await prisma.edit.findMany({
    where: pagedWhere,
    include: EDIT_INCLUDE,
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * pageSize,
    take: pageSize
  });

  return {
    user,
    counts: countMap,
    totalSubmitted,
    pinnedEdits,
    edits,
    pagination: {
      page: currentPage,
      pageSize,
      totalPages,
      total
    },
    statusFilter
  };
}

export async function getCandidateEditHistory(params: {
  slug: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { slug, status, page = 1, pageSize = 20 } = params;
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const candidates = await prisma.candidate.findMany({
    select: {
      id: true,
      name: true,
      nameWiki: true,
      electionYear: true,
      races: {
        select: {
          race: {
            select: {
              office: { select: { title: true } },
              electionYear: true
            }
          }
        }
      }
    }
  });

  const matching = candidates
    .map((candidate) => ({
      ...candidate,
      slug: slugify(candidate.nameWiki?.trim() ? candidate.nameWiki : candidate.name)
    }))
    .filter((candidate) => candidate.slug === slug)
    .sort((a, b) => b.electionYear - a.electionYear);

  if (matching.length === 0) {
    return null;
  }

  const candidate = matching[0];

  const statusFilter = mapStatusParam(status);
  const baseWhere: Prisma.EditWhereInput = {
    entityType: 'CANDIDATE',
    entityId: candidate.id
  };

  const counts = await prisma.edit.groupBy({
    by: ['status'],
    where: baseWhere,
    _count: { _all: true }
  });

  const countMap: Record<EditStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    APPLIED: 0,
    SUPERSEDED: 0
  };

  for (const row of counts) {
    countMap[row.status] = row._count._all;
  }

  const totalSubmitted = Object.values(countMap).reduce((sum, value) => sum + value, 0);

  const pinnedEdits = statusFilter || countMap.PENDING === 0
    ? []
    : await prisma.edit.findMany({
        where: { ...baseWhere, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: EDIT_INCLUDE
      });

  const pagedWhere: Prisma.EditWhereInput = statusFilter
    ? { ...baseWhere, status: statusFilter }
    : { ...baseWhere, NOT: { status: 'PENDING' } };

  const total = await prisma.edit.count({ where: pagedWhere });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(normalizedPage, totalPages);

  const edits = await prisma.edit.findMany({
    where: pagedWhere,
    include: EDIT_INCLUDE,
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * pageSize,
    take: pageSize
  });

  return {
    candidate,
    counts: countMap,
    totalSubmitted,
    pinnedEdits,
    edits,
    pagination: {
      page: currentPage,
      pageSize,
      totalPages,
      total
    },
    statusFilter
  };
}

export type SerializedEdit = ReturnType<typeof serializeEdit>;

export function serializeEdit(edit: EditWithRelations) {
  return {
    id: edit.id,
    entityType: edit.entityType,
    entityId: edit.entityId,
    field: edit.field,
    status: edit.status,
    rationale: edit.rationale,
    oldValue: edit.oldValue,
    newValue: edit.newValue,
    moderatorNote: edit.moderatorNote,
    createdAt: edit.createdAt.toISOString(),
    reviewedAt: edit.reviewedAt ? edit.reviewedAt.toISOString() : null,
    appliedAt: edit.appliedAt ? edit.appliedAt.toISOString() : null,
    user: edit.user
      ? {
          publicId: edit.user.publicId ?? null,
          role: edit.user.role,
          editsAccepted: edit.user.editsAccepted,
          editsRejected: edit.user.editsRejected
        }
      : null,
    moderator: edit.moderator
      ? {
          publicId: edit.moderator.publicId ?? null,
          role: edit.moderator.role ?? null
        }
      : null
  };
}

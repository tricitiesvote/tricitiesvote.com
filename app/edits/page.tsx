import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { EditLogTable } from '@/components/wiki/EditLogTable';
import { EDIT_INCLUDE, serializeEdit } from '@/lib/wiki/editQueries';
import { getViewer } from '@/lib/auth/getViewer';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Superseded', value: 'SUPERSEDED' }
] as const;

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function buildQuery(nextStatus: string, searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  if (nextStatus !== 'all') {
    params.set('status', nextStatus);
  }

  const entityType = searchParams.entityType;
  const entityId = searchParams.entityId;

  if (typeof entityType === 'string') {
    params.set('entityType', entityType);
  }
  if (typeof entityId === 'string') {
    params.set('entityId', entityId);
  }

  const query = params.toString();
  return query ? `/edits?${query}` : '/edits';
}

export default async function PublicEditsPage({ searchParams }: PageProps) {
  const viewer = await getViewer();

  const statusParam = typeof searchParams.status === 'string' ? searchParams.status : 'all';
  const entityType = typeof searchParams.entityType === 'string' ? searchParams.entityType : undefined;
  const entityId = typeof searchParams.entityId === 'string' ? searchParams.entityId : undefined;

  const where: Prisma.EditWhereInput = {};

  if (statusParam && statusParam !== 'all') {
    where.status = statusParam as any;
  }

  if (entityType) {
    where.entityType = entityType as any;
  }

  if (entityId) {
    where.entityId = entityId;
  }

  const edits = await prisma.edit.findMany({
    where,
    include: EDIT_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const serialized = edits.map(serializeEdit);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Public Edit Trail</h1>
            <p className="text-sm text-slate-500">
              Latest 50 community submissions. Moderators can explore deeper controls in the admin console.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            {STATUS_OPTIONS.map((option) => {
              const href = buildQuery(option.value, searchParams);
              const isActive = option.value === statusParam;
              return (
                <Link
                  key={option.value}
                  href={href}
                  className={`inline-flex items-center rounded-md border px-3 py-2 font-medium transition ${
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </nav>
        </header>

      {entityType || entityId ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Filtering for {entityType ? `entity type ${entityType}` : ''}
          {entityType && entityId ? ' · ' : ''}
          {entityId ? `entity id ${entityId}` : ''}
          {' '}
          <Link href="/edits" className="underline font-medium">
            Clear filters
          </Link>
        </div>
      ) : null}

      <EditLogTable
        edits={serialized}
        pinnedEdits={[]}
        showContributorColumn
        showEntityColumn
        viewerRole={viewer?.role}
        emptyMessage="No edits yet. Check back soon!"
      />
    </div>
  );
}

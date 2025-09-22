import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUserEditHistory, serializeEdit } from '@/lib/wiki/editQueries';
import { getViewer } from '@/lib/auth/getViewer';
import { EditLogTable } from '@/components/wiki/EditLogTable';

const STATUS_SEGMENTS = [
  { label: 'All activity', slug: undefined },
  { label: 'Pending', slug: 'pending' },
  { label: 'Accepted', slug: 'accepted' },
  { label: 'Declined', slug: 'declined' }
] as const;

type StatusSlug = typeof STATUS_SEGMENTS[number]['slug'];

interface UserEditHistoryViewProps {
  publicId: string;
  status: StatusSlug;
  searchParams: Record<string, string | string[] | undefined>;
}

function buildPageLink(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page') continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set('page', page.toString());
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export async function UserEditHistoryView({
  publicId,
  status,
  searchParams
}: UserEditHistoryViewProps) {
  const viewer = await getViewer();
  const pageParam = searchParams.page;
  const page = Array.isArray(pageParam) ? Number.parseInt(pageParam[0] ?? '1', 10) : Number.parseInt(pageParam ?? '1', 10);

  const history = await getUserEditHistory({ publicId, status, page });

  if (!history) {
    notFound();
  }

  const { user, counts, pinnedEdits, edits, pagination, statusFilter, totalSubmitted } = history;

  const serializedPinned = pinnedEdits.map(serializeEdit);
  const serializedEdits = edits.map(serializeEdit);

  const activeSlug = status;
  const basePath = status ? `/edits/user/${publicId}/${status}` : `/edits/user/${publicId}`;

  const contributorId = (user.publicId ?? publicId).slice(0, 6);

  const acceptedCount = counts.APPROVED + counts.APPLIED;
  const declinedCount = counts.REJECTED + counts.SUPERSEDED;
  const pendingCount = counts.PENDING;

  return (
    <div className="admin-theme">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contributor {contributorId}</h1>
              <p className="text-gray-600 text-sm">
                {totalSubmitted} total edit{submittedPlural(totalSubmitted)} · Member since{' '}
                {timeAgo(new Date(user.createdAt))}
              </p>
            </div>
          <div className="text-sm text-gray-600">
            <p>Role: {user.role}</p>
            <p>Accepted: {acceptedCount} · Declined: {declinedCount} · Pending: {pendingCount}</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 text-sm">
          {STATUS_SEGMENTS.map((segment) => {
            const href = segment.slug ? `/edits/user/${publicId}/${segment.slug}` : `/edits/user/${publicId}`;
            const isActive = segment.slug === activeSlug;
            return (
              <Link
                key={segment.label}
                href={href}
                className={`px-3 py-2 rounded-md border text-sm ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {segment.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <EditLogTable
        pinnedEdits={statusFilter ? [] : serializedPinned}
        edits={serializedEdits}
        showContributorColumn={false}
        showEntityColumn
        viewerRole={viewer?.role}
        emptyMessage="No edits match this filter yet."
      />

      {pagination.totalPages > 1 ? (
        <footer className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            {pagination.page > 1 ? (
              <Link
                href={buildPageLink(basePath, searchParams, pagination.page - 1)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
              >
                Previous
              </Link>
            ) : null}
            {pagination.page < pagination.totalPages ? (
              <Link
                href={buildPageLink(basePath, searchParams, pagination.page + 1)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
              >
                Next
              </Link>
            ) : null}
          </div>
        </footer>
      ) : null}
      </div>
    </div>
  );
}

function submittedPlural(total: number) {
  return total === 1 ? '' : 's';
}

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

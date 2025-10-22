import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCandidateEditHistory, serializeEdit } from '@/lib/wiki/editQueries';
import { getViewer } from '@/lib/auth/getViewer';
import { EditLogTable } from '@/components/wiki/EditLogTable';
import { slugify } from '@/lib/utils';

const STATUS_SEGMENTS = [
  { label: 'All activity', slug: undefined },
  { label: 'Pending', slug: 'pending' },
  { label: 'Accepted', slug: 'accepted' },
  { label: 'Declined', slug: 'declined' }
] as const;

type StatusSlug = (typeof STATUS_SEGMENTS)[number]['slug'];

interface CandidateEditHistoryViewProps {
  slug: string;
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

function resolveCandidateLink(slug: string, electionYear: number) {
  return `/${electionYear}/candidate/${slug}`;
}

export async function CandidateEditHistoryView({
  slug,
  status,
  searchParams
}: CandidateEditHistoryViewProps) {
  const viewer = await getViewer();
  const pageParam = searchParams.page;
  const page = Array.isArray(pageParam) ? Number.parseInt(pageParam[0] ?? '1', 10) : Number.parseInt(pageParam ?? '1', 10);

  const history = await getCandidateEditHistory({ slug, status, page });

  if (!history) {
    notFound();
  }

  const { candidate, counts, pinnedEdits, edits, pagination, statusFilter, totalSubmitted } = history;

  const displayName = candidate.nameWiki?.trim() ? candidate.nameWiki : candidate.name;
  const candidateSlug = slugify(displayName ?? candidate.name);
  const candidateLink = resolveCandidateLink(candidateSlug, candidate.electionYear);

  const serializedPinned = pinnedEdits.map(serializeEdit);
  const serializedEdits = edits.map(serializeEdit);

  const activeSlug = status;
  const basePath = status ? `/edits/candidate/${slug}/${status}` : `/edits/candidate/${slug}`;

  const acceptedCount = counts.APPROVED + counts.APPLIED;
  const declinedCount = counts.REJECTED + counts.SUPERSEDED;
  const pendingCount = counts.PENDING;

  const latestRace = [...candidate.races].sort((a, b) => {
    const yearA = a.race?.electionYear ?? 0;
    const yearB = b.race?.electionYear ?? 0;
    return yearB - yearA;
  })[0];

  const raceTitle = latestRace?.race?.office?.title;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Edits for {displayName}</CardTitle>
          <CardDescription>
            {raceTitle ? `${raceTitle} · ` : ''}Election {candidate.electionYear} · {totalSubmitted} total edits ·{' '}
            <Link className="text-blue-600 hover:text-blue-700" href={candidateLink}>
              View candidate page
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Accepted" value={acceptedCount} variant="success" />
            <StatCard label="Declined" value={declinedCount} variant="muted" />
            <StatCard label="Pending" value={pendingCount} variant="warning" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Activity filters</CardTitle>
          <CardDescription>Review edits by status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STATUS_SEGMENTS.map((segment) => {
              const href = segment.slug ? `/edits/candidate/${slug}/${segment.slug}` : `/edits/candidate/${slug}`;
              const isActive = segment.slug === activeSlug;
              return (
                <Link
                  key={segment.label}
                  href={href}
                  className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {segment.label}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <EditLogTable
        pinnedEdits={statusFilter ? [] : serializedPinned}
        edits={serializedEdits}
        showContributorColumn
        showEntityColumn={false}
        viewerRole={viewer?.role}
        emptyMessage="No edits match this filter yet."
      />

      {pagination.totalPages > 1 ? (
        <footer className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            {pagination.page > 1 ? (
              <Link
                href={buildPageLink(basePath, searchParams, pagination.page - 1)}
                className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                Previous
              </Link>
            ) : null}
            {pagination.page < pagination.totalPages ? (
              <Link
                href={buildPageLink(basePath, searchParams, pagination.page + 1)}
                className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                Next
              </Link>
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  variant
}: {
  label: string;
  value: number;
  variant: 'success' | 'warning' | 'muted';
}) {
  const styles = {
    success: { borderColor: '#bbf7d0', background: '#ecfdf5', color: '#047857' },
    warning: { borderColor: '#fcd34d', background: '#fffbeb', color: '#b45309' },
    muted: { borderColor: '#e2e8f0', background: '#f8fafc', color: '#475569' }
  } as const;

  const palette = styles[variant];

  return (
    <div
      style={{
        border: `1px solid ${palette.borderColor}`,
        background: palette.background,
        color: palette.color,
        borderRadius: 12,
        padding: '16px'
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 600, margin: '12px 0 0 0' }}>{value}</p>
    </div>
  );
}

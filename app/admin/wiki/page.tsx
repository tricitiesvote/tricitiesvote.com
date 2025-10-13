'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DiffView } from '@/components/wiki/DiffView';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface OverviewResponse {
  pending: {
    total: number;
    byEntity: Record<string, number>;
    oldest: {
      id: string;
      entityType: string;
      entityId: string;
      field: string;
      createdAt: string;
    } | null;
  };
  recentActivity: {
    approvalsLast7Days: number;
    rejectionsLast7Days: number;
    topModerators: Array<{
      moderatorId: string | null;
      moderatedCount: number;
      email: string | null;
      name: string | null;
      role: string | null;
      publicId: string | null;
    }>;
    topContributors: Array<{
      id: string;
      email: string;
      name: string | null;
      role: 'COMMUNITY' | 'CANDIDATE' | 'MODERATOR' | 'ADMIN';
      editsAccepted: number;
      editsRejected: number;
      editsPending: number;
      createdAt: string;
      publicId: string;
    }>;
  };
  recentModeratedEdits: Array<{
    id: string;
    status: string;
    field: string;
    entityType: string;
    entityId: string;
    rationale: string;
    reviewedAt: string | null;
    moderatorNote: string | null;
    user: {
      id: string;
      email: string;
      name: string | null;
      publicId: string | null;
      role: string;
    };
    moderator: {
      id: string;
      email: string;
      name: string | null;
      publicId: string | null;
      role: string | null;
    } | null;
  }>;
}

interface WikiEdit {
  id: string;
  field: string;
  entityType: string;
  entityId: string;
  rationale: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'SUPERSEDED';
  createdAt: string;
  reviewedAt?: string | null;
  moderatorNote?: string | null;
  oldValue: any;
  newValue: any;
  user: {
    id: string;
    email: string | null;
    name?: string | null;
    role: string;
    publicId?: string | null;
    editsAccepted?: number;
    editsRejected?: number;
  };
  moderator?: {
    id: string;
    email: string;
    name?: string | null;
    publicId?: string | null;
    role?: string | null;
  } | null;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: 'COMMUNITY' | 'CANDIDATE' | 'MODERATOR' | 'ADMIN';
  editsAccepted: number;
  editsRejected: number;
  editsPending: number;
  candidateId: string | null;
  createdAt: string;
  updatedAt: string;
  publicId: string;
}

interface UsersResponse {
  users: AdminUser[];
  totals: {
    overall: number;
    byRole: Record<'COMMUNITY' | 'CANDIDATE' | 'MODERATOR' | 'ADMIN', number>;
  };
}

const ENTITY_FILTERS = ['ALL', 'CANDIDATE', 'RACE', 'OFFICE', 'GUIDE'] as const;
const HISTORY_FILTERS = ['APPROVED', 'REJECTED', 'ALL'] as const;
const ROLE_FILTERS = ['ALL', 'COMMUNITY', 'CANDIDATE', 'MODERATOR', 'ADMIN'] as const;

export default function WikiAdminPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [overviewError, setOverviewError] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);

  const [pendingEdits, setPendingEdits] = useState<WikiEdit[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [pendingEntityFilter, setPendingEntityFilter] = useState<(typeof ENTITY_FILTERS)[number]>('ALL');
  const [pendingSearch, setPendingSearch] = useState('');

  const [historyEdits, setHistoryEdits] = useState<WikiEdit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyFilter, setHistoryFilter] = useState<(typeof HISTORY_FILTERS)[number]>('APPROVED');

  const [usersData, setUsersData] = useState<UsersResponse | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>('ALL');
  const [userSearchDraft, setUserSearchDraft] = useState('');

  const isAuthorized = useMemo(
    () => Boolean(user && ['MODERATOR', 'ADMIN'].includes(user.role)),
    [user]
  );

  useEffect(() => {
    if (!isAuthorized) return;
    loadOverview();
    loadPendingEdits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadHistory(historyFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, historyFilter]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadUsers(userRoleFilter === 'ALL' ? undefined : userRoleFilter, userSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, userRoleFilter, userSearchTerm]);

  const loadOverview = async () => {
    try {
      setOverviewLoading(true);
      setOverviewError('');
      const response = await fetch('/api/admin/wiki/overview');
      const data = await response.json();
      if (response.ok) {
        setOverview(data);
      } else {
        setOverviewError(data.error || 'Failed to load overview');
      }
    } catch (error) {
      setOverviewError('Network error while loading overview');
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadPendingEdits = async () => {
    try {
      setPendingLoading(true);
      setPendingError('');
      const response = await fetch('/api/edits/pending');
      const data = await response.json();
      if (response.ok) {
        setPendingEdits(data.edits || []);
      } else {
        setPendingError(data.error || 'Failed to load pending edits');
      }
    } catch (error) {
      setPendingError('Network error while loading pending edits');
    } finally {
      setPendingLoading(false);
    }
  };

  const loadHistory = async (filter: (typeof HISTORY_FILTERS)[number]) => {
    try {
      setHistoryLoading(true);
      setHistoryError('');
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.set('status', filter);
      }
      const response = await fetch(`/api/edits${params.toString() ? `?${params.toString()}` : ''}`);
      const data = await response.json();
      if (response.ok) {
        const edits: WikiEdit[] = (data.edits || []).filter((edit: WikiEdit) => edit.status !== 'PENDING');
        setHistoryEdits(edits);
      } else {
        setHistoryError(data.error || 'Failed to load history');
      }
    } catch (error) {
      setHistoryError('Network error while loading history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadUsers = async (
    role?: 'COMMUNITY' | 'CANDIDATE' | 'MODERATOR' | 'ADMIN',
    search?: string
  ) => {
    try {
      setUsersLoading(true);
      setUsersError('');
      const params = new URLSearchParams();
      if (role) params.set('role', role);
      if (search) params.set('search', search);
      const response = await fetch(`/api/admin/wiki/users${params.toString() ? `?${params.toString()}` : ''}`);
      const data = await response.json();
      if (response.ok) {
        setUsersData(data);
      } else {
        setUsersError(data.error || 'Failed to load users');
      }
    } catch (error) {
      setUsersError('Network error while loading users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleReview = async (
    editId: string,
    status: 'APPROVED' | 'REJECTED',
    moderatorNote?: string
  ) => {
    try {
      const response = await fetch(`/api/edits/${editId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ status, moderatorNote })
      });

      const data = await response.json();

      if (response.ok) {
        setPendingEdits((prev) => prev.filter((edit) => edit.id !== editId));
        loadOverview();
        loadHistory(historyFilter);
        if (usersData) {
          loadUsers(userRoleFilter === 'ALL' ? undefined : userRoleFilter, userSearchTerm);
        }
        return { success: true };
      }

      return { success: false, error: data.error || 'Failed to update edit' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const handleRoleUpdate = async (targetUser: AdminUser, nextRole: AdminUser['role']) => {
    if (targetUser.role === nextRole) return;
    try {
      const response = await fetch(`/api/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ role: nextRole })
      });

      const data = await response.json();

      if (response.ok) {
        setUsersData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.map((userItem) =>
              userItem.id === targetUser.id ? { ...userItem, role: nextRole } : userItem
            )
          };
        });
        loadOverview();
        return { success: true };
      }

      return { success: false, error: data.error || 'Failed to update role' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const filteredPending = useMemo(() => {
    const searchTerm = pendingSearch.trim().toLowerCase();
    return pendingEdits.filter((edit) => {
      const matchesEntity =
        pendingEntityFilter === 'ALL' || edit.entityType === pendingEntityFilter;
      if (!matchesEntity) return false;
      if (!searchTerm) return true;
      const haystack = [
        edit.user?.email || '',
        edit.field || '',
        edit.entityId || '',
        edit.rationale || ''
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm);
    });
  }, [pendingEdits, pendingEntityFilter, pendingSearch]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-semibold mb-4">Authentication required</h1>
          <p className="text-gray-600 mb-6">
            Sign in with a moderator or admin account to access the wiki admin console.
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-semibold mb-4">Access denied</h1>
          <p className="text-gray-600">
            This area is limited to moderators and administrators. If you believe you
            should have access, contact an administrator for a role upgrade.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="border-b bg-white shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Wiki Admin Console</h1>
              <p className="text-slate-500 text-sm">
                Monitor pending edits, review recent activity, and manage trusted contributors.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  loadOverview();
                  loadPendingEdits();
                  loadHistory(historyFilter);
                  loadUsers(userRoleFilter === 'ALL' ? undefined : userRoleFilter, userSearchTerm);
                }}
              >
                Refresh data
              </Button>
              <Link
                href="/edits"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                View public audit trail
              </Link>
            </div>
          </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Pending edits"
              value={overview?.pending.total ?? 0}
              loading={overviewLoading}
              hint={overview?.pending.byEntity}
              error={overviewError}
            />
            <SummaryCard
              title="Approvals (7d)"
              value={overview?.recentActivity.approvalsLast7Days ?? 0}
              loading={overviewLoading}
            />
            <SummaryCard
              title="Rejections (7d)"
              value={overview?.recentActivity.rejectionsLast7Days ?? 0}
              loading={overviewLoading}
            />
            <SummaryCard
              title="Oldest pending"
              value={overview?.pending.oldest ? timeAgo(new Date(overview.pending.oldest.createdAt)) : '—'}
              loading={overviewLoading}
              footer={overview?.pending.oldest ? `${overview.pending.oldest.entityType} • ${overview.pending.oldest.field}` : ''}
            />
          </section>

          {overview?.recentActivity.topModerators?.length ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Active moderators this week</CardTitle>
                <CardDescription>Most approvals/rejections completed in the last seven days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overview.recentActivity.topModerators.map((moderator) => (
                  <div
                    key={moderator.moderatorId || 'unknown'}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">
                        {moderator.name || moderator.email || 'Unknown moderator'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {moderator.role || 'MODERATOR'} • {moderator.email || 'No email'}
                      </p>
                      {moderator.publicId ? (
                        <p className="text-xs text-slate-400">
                          ID:{' '}
                          <Link className="text-blue-600 hover:text-blue-700" href={`/edits/user/${moderator.publicId}`}>
                            {moderator.publicId.slice(0, 6)}
                          </Link>
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-800">
                      {moderator.moderatedCount} reviews
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {overview?.recentActivity.topContributors?.length ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Top contributors</CardTitle>
                <CardDescription>Most accepted submissions overall.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {overview.recentActivity.topContributors.map((contributor) => (
                    <div key={contributor.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{contributor.email}</p>
                          <p className="text-xs text-slate-500">
                            {contributor.name || 'No name'} • Joined {timeAgo(new Date(contributor.createdAt))}
                          </p>
                          <p className="text-xs text-slate-400">
                            ID:{' '}
                            <Link className="text-blue-600 hover:text-blue-700" href={`/edits/user/${contributor.publicId}`}>
                              {contributor.publicId.slice(0, 6)}
                            </Link>
                          </p>
                        </div>
                        <RoleBadge role={contributor.role} />
                      </div>
                      <Separator className="my-3" />
                      <dl className="grid grid-cols-3 gap-3 text-xs text-slate-600">
                        <div>
                          <dt className="font-medium text-slate-500 uppercase tracking-wide">Accepted</dt>
                          <dd className="text-base text-slate-900">{contributor.editsAccepted}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-500 uppercase tracking-wide">Declined</dt>
                          <dd className="text-base text-slate-900">{contributor.editsRejected}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-500 uppercase tracking-wide">Pending</dt>
                          <dd className="text-base text-slate-900">{contributor.editsPending}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pending moderation</CardTitle>
              <CardDescription>
                Approve or decline community submissions. Approved edits apply instantly, rejected edits notify contributors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={pendingEntityFilter}
                    onChange={(event) => setPendingEntityFilter(event.target.value as (typeof ENTITY_FILTERS)[number])}
                    aria-label="Filter by entity type"
                    style={{ width: 200 }}
                  >
                    {ENTITY_FILTERS.map((option) => (
                      <option key={option} value={option}>
                        {option === 'ALL' ? 'All entity types' : option}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={pendingSearch}
                    onChange={(event) => setPendingSearch(event.target.value)}
                    placeholder="Search contributor, field, rationale"
                    style={{ width: 260 }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPendingSearch('')}>
                    Clear
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => loadPendingEdits()}>
                    Reload
                  </Button>
                </div>
              </div>

              {pendingLoading ? (
                <LoadingState label="Loading pending edits..." />
              ) : pendingError ? (
                <ErrorState message={pendingError} onRetry={loadPendingEdits} />
              ) : filteredPending.length === 0 ? (
                <EmptyState
                  title="No pending edits"
                  message="All caught up! We'll let you know when new changes arrive."
                />
              ) : (
                <div className="space-y-6">
                  {filteredPending.map((edit) => (
                    <PendingReviewCard
                      key={edit.id}
                      edit={edit}
                      onReview={handleReview}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Moderation history</CardTitle>
              <CardDescription>Latest approved or declined edits. Use filters to drill into recent actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={historyFilter} onValueChange={(value) => setHistoryFilter(value as typeof historyFilter)} defaultValue="APPROVED">
                <TabsList>
                  {HISTORY_FILTERS.map((option) => (
                    <TabsTrigger key={option} value={option}>
                      {option === 'ALL' ? 'All' : option.toLowerCase()}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {historyLoading ? (
                <LoadingState label="Loading moderation history..." />
              ) : historyError ? (
                <ErrorState message={historyError} onRetry={() => loadHistory(historyFilter)} />
              ) : historyEdits.length === 0 ? (
                <EmptyState
                  title="No recent activity"
                  message="No edits match this filter yet."
                />
              ) : (
                <div className="space-y-3">
                  {historyEdits.map((edit) => (
                    <HistoryRow key={edit.id} edit={edit} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Contributors & roles</CardTitle>
              <CardDescription>Promote moderators, audit activity, and spot power users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                onSubmit={(event) => {
                  event.preventDefault();
                  setUserSearchTerm(userSearchDraft.trim());
                }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={userRoleFilter}
                    onChange={(event) => setUserRoleFilter(event.target.value as (typeof ROLE_FILTERS)[number])}
                    style={{ width: 160 }}
                  >
                    {ROLE_FILTERS.map((option) => (
                      <option key={option} value={option}>
                        {option === 'ALL' ? 'All roles' : option}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={userSearchDraft}
                    onChange={(event) => setUserSearchDraft(event.target.value)}
                    placeholder="Search email or name"
                    style={{ width: 240 }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setUserSearchDraft('');
                    setUserSearchTerm('');
                  }}>
                    Clear
                  </Button>
                  <Button type="submit" size="sm">
                    Search
                  </Button>
                </div>
              </form>

              {usersLoading ? (
                <LoadingState label="Loading users..." />
              ) : usersError ? (
                <ErrorState message={usersError} onRetry={() => loadUsers(userRoleFilter === 'ALL' ? undefined : userRoleFilter, userSearchTerm)} />
              ) : !usersData || usersData.users.length === 0 ? (
                <EmptyState
                  title="No matching users"
                  message="Try broadening your search or invite contributors to submit edits."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Accepted</TableHead>
                        <TableHead>Declined</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData.users.map((contributor) => (
                        <TableRow key={contributor.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">{contributor.email}</p>
                              <p className="text-xs text-slate-500">{contributor.name || 'No name'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/edits/user/${contributor.publicId}`}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {contributor.publicId.slice(0, 6)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <RoleBadge role={contributor.role} />
                          </TableCell>
                          <TableCell>{contributor.editsAccepted}</TableCell>
                          <TableCell>{contributor.editsRejected}</TableCell>
                          <TableCell>{contributor.editsPending}</TableCell>
                          <TableCell>{new Date(contributor.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <RoleSelector
                              currentUser={user}
                              targetUser={contributor}
                              onChange={handleRoleUpdate}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 flex flex-wrap gap-4">
                    <p>Total users: {usersData.totals.overall}</p>
                    <p>
                      Admins: {usersData.totals.byRole.ADMIN} · Moderators: {usersData.totals.byRole.MODERATOR} · Candidates: {usersData.totals.byRole.CANDIDATE} · Community: {usersData.totals.byRole.COMMUNITY}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  hint,
  footer,
  loading,
  error
}: {
  title: string;
  value: number | string;
  hint?: Record<string, number>;
  footer?: string;
  loading?: boolean;
  error?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="uppercase text-xs tracking-wide text-slate-500">{title}</CardDescription>
        {loading ? (
          <div className="animate-pulse h-8 w-20 rounded bg-slate-200" />
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <CardTitle className="text-3xl font-semibold text-slate-900">{value}</CardTitle>
        )}
      </CardHeader>
      {(hint || footer) && !loading && !error ? (
        <CardContent className="pt-0 space-y-1">
          {hint ? (
            <p className="text-xs text-slate-500">
              {Object.entries(hint)
                .filter(([, count]) => count > 0)
                .map(([key, count]) => `${key}: ${count}`)
                .join(' • ')}
            </p>
          ) : null}
          {footer ? <p className="text-xs text-slate-400">{footer}</p> : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

function PendingReviewCard({
  edit,
  onReview
}: {
  edit: WikiEdit;
  onReview: (id: string, status: 'APPROVED' | 'REJECTED', note?: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const contributorId = edit.user?.publicId ?? null;

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    setProcessing(true);
    setError('');
    const result = await onReview(edit.id, status, note || undefined);
    if (!result.success) {
      setError(result.error || 'Failed to update edit');
    }
    setProcessing(false);
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                {edit.entityType}
              </Badge>
              <span>{timeAgo(new Date(edit.createdAt))}</span>
            </div>
            <CardTitle className="text-xl text-slate-900">{edit.field}</CardTitle>
            <p className="text-sm text-slate-500">
              Submitted by{' '}
              {contributorId ? (
                <Link href={`/edits/user/${contributorId}`} className="text-blue-600 hover:text-blue-700">
                  {contributorId.slice(0, 6)}
                </Link>
              ) : (
                <span className="font-mono text-slate-500">unknown</span>
              )}
              {edit.user?.email ? (
                <span className="text-xs text-slate-400 ml-2">{edit.user.email}</span>
              ) : null}
            </p>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p>Queue ID: <span className="font-mono text-slate-700">{edit.id.slice(0, 8)}…</span></p>
            <p>Entity: <span className="font-mono text-slate-700">{edit.entityId}</span></p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <DiffView oldValue={stringifyValue(edit.oldValue)} newValue={stringifyValue(edit.newValue)} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">Contributor rationale</p>
          <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 whitespace-pre-wrap">
            {edit.rationale}
          </p>
        </div>

        {showNote ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Moderator note</p>
            <Textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional context for the contributor"
            />
          </div>
        ) : null}

        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="default" disabled={processing} onClick={() => handleAction('APPROVED')}>
            Approve
          </Button>
          <Button
            variant="destructive"
            disabled={processing}
            onClick={() => {
              if (!showNote) {
                setShowNote(true);
                return;
              }
              handleAction('REJECTED');
            }}
          >
            {showNote ? 'Submit rejection' : 'Reject'}
          </Button>
          <Button variant="ghost" onClick={() => setShowNote((prev) => !prev)}>
            {showNote ? 'Hide note' : 'Add note'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryRow({ edit }: { edit: WikiEdit }) {
  const contributorId = edit.user?.publicId ?? null;
  const moderatorId = edit.moderator?.publicId ?? null;

  return (
    <Card className="border-slate-200">
      <CardContent className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
              {edit.status.toLowerCase()}
            </Badge>
            <span>{edit.entityType}</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900">{edit.field}</h3>
          <p className="text-sm text-slate-600">
            {contributorId ? (
              <Link href={`/edits/user/${contributorId}`} className="text-blue-600 hover:text-blue-700">
                {contributorId.slice(0, 6)}
              </Link>
            ) : (
              <span className="font-mono text-slate-500">unknown</span>
            )}
            {edit.user?.email ? (
              <span className="text-xs text-slate-400 ml-2">{edit.user.email}</span>
            ) : null}
          </p>
          <p className="text-xs text-slate-400">
            Reviewed {edit.reviewedAt ? timeAgo(new Date(edit.reviewedAt)) : 'just now'} by{' '}
            {moderatorId ? (
              <Link href={`/edits/user/${moderatorId}`} className="text-blue-600 hover:text-blue-700">
                {moderatorId.slice(0, 6)}
              </Link>
            ) : (
              'moderator'
            )}
            {edit.moderator?.email ? (
              <span className="text-xs text-slate-400 ml-2">{edit.moderator.email}</span>
            ) : null}
          </p>
          {edit.moderatorNote ? (
            <p className="text-xs text-slate-500 mt-2">
              Moderator note: {edit.moderatorNote}
            </p>
          ) : null}
        </div>
        <div className="sm:text-right sm:min-w-[180px]">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Change (new value)</p>
          <pre className="mt-2 max-w-sm overflow-x-auto rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
            {stringifyValue(edit.newValue)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  const configs: Record<AdminUser['role'], { className: string; label: string }> = {
    ADMIN: { className: 'bg-purple-100 text-purple-700 border-purple-200', label: 'admin' },
    MODERATOR: { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'moderator' },
    CANDIDATE: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'candidate' },
    COMMUNITY: { className: 'bg-slate-100 text-slate-600 border-slate-200', label: 'community' }
  };

  const config = configs[role];
  return (
    <Badge variant="outline" className={cn('uppercase text-[10px] font-semibold', config.className)}>
      {config.label}
    </Badge>
  );
}

function RoleSelector({
  currentUser,
  targetUser,
  onChange
}: {
  currentUser: { id: string; role: AdminUser['role'] } | null;
  targetUser: AdminUser;
  onChange: (user: AdminUser, nextRole: AdminUser['role']) => Promise<{ success: boolean; error?: string }>;
}) {
  const [pendingRole, setPendingRole] = useState<AdminUser['role']>(targetUser.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPendingRole(targetUser.role);
  }, [targetUser.role]);

  const canEdit = Boolean(currentUser && currentUser.role === 'ADMIN' && currentUser.id !== targetUser.id);

  const handleSave = async (nextRole: AdminUser['role']) => {
    if (!canEdit) return;
    setSaving(true);
    setError('');
    const result = await onChange(targetUser, nextRole);
    if (!result.success) {
      setError(result.error || 'Failed to update role');
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Select
        value={pendingRole}
        disabled={!canEdit || saving}
        onChange={(event) => {
          const nextRole = event.target.value as AdminUser['role'];
          setPendingRole(nextRole);
          handleSave(nextRole);
        }}
        style={{ width: 140 }}
      >
        {['COMMUNITY', 'CANDIDATE', 'MODERATOR', 'ADMIN'].map((roleOption) => (
          <option key={roleOption} value={roleOption}>
            {roleOption}
          </option>
        ))}
      </Select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {!canEdit ? (
        <p className="text-xs text-gray-400">Admin-only</p>
      ) : saving ? (
        <p className="text-xs text-gray-500">Saving…</p>
      ) : null}
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <Alert className="bg-white text-slate-600">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-6 py-10 text-slate-500">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="text-left">
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <Button variant="outline" size="sm" className="mt-4 border-white text-white hover:bg-white/10" onClick={onRetry}>
        Try again
      </Button>
    </Alert>
  );
}

function stringifyValue(value: any) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
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
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

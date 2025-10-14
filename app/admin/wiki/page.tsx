'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface WikiEdit {
  id: string;
  field: string;
  entityType: string;
  entityId: string;
  rationale: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'SUPERSEDED';
  createdAt: string;
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
    editsPending?: number;
  };
}

interface EntityData {
  [entityId: string]: {
    name: string;
    slug: string;
    year: number;
  };
}

export default function WikiAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [pendingEdits, setPendingEdits] = useState<WikiEdit[]>([]);
  const [entityData, setEntityData] = useState<EntityData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAuthorized = useMemo(
    () => Boolean(user && ['MODERATOR', 'ADMIN'].includes(user.role)),
    [user]
  );

  useEffect(() => {
    if (!isAuthorized) return;
    loadPendingEdits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  const loadPendingEdits = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/edits/pending');
      const data = await response.json();
      if (response.ok) {
        const edits = data.edits || [];
        setPendingEdits(edits);

        // Fetch entity data for all candidate edits
        const candidateIds = edits
          .filter((e: WikiEdit) => e.entityType === 'CANDIDATE')
          .map((e: WikiEdit) => e.entityId);

        if (candidateIds.length > 0) {
          await loadEntityData(candidateIds);
        }
      } else {
        setError(data.error || 'Failed to load pending edits');
      }
    } catch (error) {
      setError('Network error while loading pending edits');
    } finally {
      setLoading(false);
    }
  };

  const loadEntityData = async (ids: string[]) => {
    try {
      const response = await fetch('/api/candidates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (response.ok) {
        const data = await response.json();
        const entityMap: EntityData = {};
        data.candidates.forEach((c: any) => {
          entityMap[c.id] = {
            name: c.name,
            slug: c.slug,
            year: c.year
          };
        });
        setEntityData(entityMap);
      }
    } catch (error) {
      console.error('Failed to load entity data:', error);
    }
  };

  const handleReview = async (editId: string, status: 'APPROVED' | 'REJECTED', note: string) => {
    try {
      const response = await fetch(`/api/edits/${editId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ status, moderatorNote: note })
      });

      const data = await response.json();

      if (response.ok) {
        setPendingEdits((prev) => prev.filter((edit) => edit.id !== editId));
        return { success: true };
      }

      return { success: false, error: data.error || 'Failed to update edit' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium mb-2">Authentication required</h1>
          <p className="text-sm text-gray-600 mb-4">Sign in to access the wiki admin console.</p>
          <a href="/login" className="text-sm text-blue-600 hover:underline">Sign in</a>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium mb-2">Access denied</h1>
          <p className="text-sm text-gray-600">This area is limited to moderators and administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Single-line header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <h1 className="font-medium text-gray-900">Wiki Admin</h1>
            <span className="text-gray-500">{pendingEdits.length} pending</span>
            <Link href="/edits" className="text-blue-600 hover:underline">Audit trail</Link>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-gray-600">{user.email}</span>
            <span className="text-xs text-gray-400">{user.role}</span>
            <button
              onClick={() => window.location.href = '/logout'}
              className="text-gray-500 hover:text-gray-700"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-sm text-gray-500">Loading edits...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : pendingEdits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">All caught up! No pending edits.</p>
          </div>
        ) : (
          <Table>
            <TableBody>
              {pendingEdits.map((edit, index) => (
                <EditRow
                  key={edit.id}
                  edit={edit}
                  entityData={entityData}
                  onReview={handleReview}
                  isEven={index % 2 === 0}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </main>
    </div>
  );
}

function EditRow({
  edit,
  entityData,
  onReview,
  isEven
}: {
  edit: WikiEdit;
  entityData: EntityData;
  onReview: (id: string, status: 'APPROVED' | 'REJECTED', note: string) => Promise<{ success: boolean; error?: string }>;
  isEven: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!note.trim()) {
      setError('Please add a note');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await onReview(edit.id, status, note.trim());

    if (!result.success) {
      setError(result.error || 'Failed to process edit');
      setIsSubmitting(false);
    }
  };

  const getPreviewText = () => {
    const oldVal = stringifyValue(edit.oldValue);
    const newVal = stringifyValue(edit.newValue);

    if (!oldVal && newVal) {
      return <span className="underline decoration-1">{newVal}</span>;
    } else if (oldVal && !newVal) {
      return <span className="line-through decoration-1">{oldVal}</span>;
    } else {
      return (
        <>
          <span className="line-through decoration-1">{oldVal}</span>
          <span className="mx-1">→</span>
          <span className="underline decoration-1">{newVal}</span>
        </>
      );
    }
  };

  const getEntityDisplay = () => {
    if (edit.entityType === 'CANDIDATE' && entityData[edit.entityId]) {
      const entity = entityData[edit.entityId];
      return {
        name: entity.name,
        url: `/${entity.year}/candidate/${entity.slug}`
      };
    }

    // Fallback
    return {
      name: `${edit.entityType} ${edit.entityId.slice(0, 8)}`,
      url: '#'
    };
  };

  const entity = getEntityDisplay();
  const bgClass = isEven ? 'bg-white' : 'bg-gray-50';

  return (
    <>
      {/* Collapsed row */}
      <TableRow className={`${bgClass} hover:bg-blue-50 cursor-pointer border-0`}>
        <TableCell className="py-3" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            {/* Left: Entity name, field, preview */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link
                href={entity.url}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-gray-900 hover:underline whitespace-nowrap"
              >
                {entity.name}
              </Link>
              <span className="text-gray-600 text-sm whitespace-nowrap">{edit.field}</span>

              {/* Preview - only show when collapsed */}
              {!isExpanded && (
                <div className="ml-4 text-sm text-gray-400 truncate flex-1">
                  {getPreviewText()}
                </div>
              )}
            </div>

            {/* Right: Contributor email */}
            <div className="flex-shrink-0 ml-4">
              {edit.user.publicId ? (
                <Link
                  href={`/edits/user/${edit.user.publicId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-gray-600 hover:underline"
                >
                  {edit.user.email || 'Unknown'}
                </Link>
              ) : (
                <span className="text-sm text-gray-600">{edit.user.email || 'Unknown'}</span>
              )}
            </div>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded content */}
      {isExpanded && (
        <TableRow className={bgClass}>
          <TableCell className="py-4 border-t border-gray-200">
            <div className="space-y-3 text-sm pl-4">
              {/* From/To */}
              <div className="space-y-1">
                <div className="text-gray-600">
                  <span className="font-medium">From:</span>{' '}
                  <span className="font-mono text-xs">{stringifyValue(edit.oldValue) || '(empty)'}</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">To:</span>{' '}
                  <span className="font-mono text-xs">{stringifyValue(edit.newValue) || '(empty)'}</span>
                </div>
              </div>

              {/* Why */}
              {edit.rationale && (
                <div className="text-gray-600">
                  <span className="font-medium">Why:</span> "{edit.rationale}"
                </div>
              )}

              {/* Notes field */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Notes (public)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note that will be visible to the contributor"
                  className="w-full max-w-2xl px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleAction('APPROVED')}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleAction('REJECTED')}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function stringifyValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

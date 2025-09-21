'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DiffView } from '@/components/wiki/DiffView';

interface Edit {
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
  rationale: string;
  entityType: string;
  entityId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'SUPERSEDED';
  createdAt: string;
  reviewedAt?: string;
  moderatorNote?: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
  moderator?: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function EditsPage() {
  const [edits, setEdits] = useState<Edit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const searchParams = useSearchParams();
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');

  useEffect(() => {
    fetchEdits();
  }, [filter, entityType, entityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEdits = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (entityType) params.set('entityType', entityType);
      if (entityId) params.set('entityId', entityId);

      const response = await fetch(`/api/edits?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setEdits(data.edits);
      } else {
        setError(data.error || 'Failed to fetch edits');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      APPLIED: 'bg-blue-100 text-blue-800',
      SUPERSEDED: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: '👑',
      MODERATOR: '🛡️',
      CANDIDATE: '🎯',
      COMMUNITY: '👤'
    };
    return badges[role as keyof typeof badges] || '👤';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Loading edit history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              {entityType && entityId ? 'Edit History' : 'Public Edit Trail'}
            </h1>

            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Edits</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="APPLIED">Applied</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {edits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">No edits found</p>
              <p>No edit history matches your current filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {edits.map((edit) => (
                <EditHistoryCard key={edit.id} edit={edit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditHistoryCard({ edit }: { edit: Edit }) {
  const [expanded, setExpanded] = useState(false);

  const stringifyValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      return String(value);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      APPLIED: 'bg-blue-100 text-blue-800',
      SUPERSEDED: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: '👑',
      MODERATOR: '🛡️',
      CANDIDATE: '🎯',
      COMMUNITY: '👤'
    };
    return badges[role as keyof typeof badges] || '👤';
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">
              {edit.entityType} - {edit.field}
            </h3>
            {getStatusBadge(edit.status)}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              {getRoleBadge(edit.user.role)} {edit.user.email}
            </span>
            <span>{new Date(edit.createdAt).toLocaleString()}</span>
            {edit.reviewedAt && (
              <span>
                Reviewed {new Date(edit.reviewedAt).toLocaleString()}
                {edit.moderator && ` by ${edit.moderator.email}`}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {expanded ? 'Show Less' : 'Show Details'}
        </button>
      </div>

      <div className="text-sm text-gray-700 mb-2">
        <strong>Rationale:</strong> {edit.rationale}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t">
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Diff:</h4>
            <DiffView
              oldValue={stringifyValue(edit.oldValue)}
              newValue={stringifyValue(edit.newValue)}
            />
          </div>

          {edit.moderatorNote && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Moderator Note:</h4>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-sm">{edit.moderatorNote}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

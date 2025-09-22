'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DiffView } from '@/components/wiki/DiffView';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Edit {
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
  rationale: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    publicId?: string | null;
    name?: string;
    role: string;
    editsAccepted: number;
    editsRejected: number;
  };
}

export default function ModeratePage() {
  const { user } = useAuth();
  const [edits, setEdits] = useState<Edit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && ['MODERATOR', 'ADMIN'].includes(user.role)) {
      fetchPendingEdits();
    } else if (user) {
      setError('Moderator access required');
      setIsLoading(false);
    }
  }, [user]);

  const fetchPendingEdits = async () => {
    try {
      const response = await fetch('/api/edits/pending');
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

  const handleReview = async (editId: string, status: 'APPROVED' | 'REJECTED', moderatorNote?: string) => {
    try {
      const response = await fetch(`/api/edits/${editId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ status, moderatorNote })
      });

      if (response.ok) {
        // Remove the edit from the list
        setEdits(edits.filter(edit => edit.id !== editId));
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <a href="/login" className="text-blue-600 hover:underline">
            Please sign in to continue
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Loading pending edits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-theme">
      <div className="min-h-screen bg-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <header className="rounded-lg bg-white px-6 py-5 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">Moderate edits</h1>
            <p className="text-sm text-slate-500 mt-1">
              Review contributor submissions, approve accurate updates, and leave guidance when declining.
            </p>
          </header>

          {edits.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
              <p className="text-lg font-medium text-slate-700">No pending edits</p>
              <p className="text-sm text-slate-500">All caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-6">
              {edits.map((edit) => (
                <EditReviewCard key={edit.id} edit={edit} onReview={handleReview} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditReviewCard({
  edit,
  onReview
}: {
  edit: Edit;
  onReview: (id: string, status: 'APPROVED' | 'REJECTED', note?: string) => void;
}) {
  const [moderatorNote, setModeratorNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const stringifyValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      return String(value);
    }
  };

  const getUserTrustBadge = (user: any) => {
    const total = user.editsAccepted + user.editsRejected;
    if (total === 0) return '🆕 New';
    if (user.editsAccepted >= 3) return '✅ Trusted';
    if (user.editsRejected > user.editsAccepted) return '⚠️ Mixed';
    return '👤 Community';
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          {edit.entityType} · {edit.field}
          <Badge variant="outline" className="border-slate-200 text-slate-500">
            {getUserTrustBadge(edit.user)}
          </Badge>
        </CardTitle>
        <p className="text-sm text-slate-500">
          Submitted by{' '}
          {edit.user.publicId ? (
            <Link href={`/edits/user/${edit.user.publicId}`} className="text-blue-600 hover:text-blue-700">
              {edit.user.publicId.slice(0, 6)}
            </Link>
          ) : (
            <span className="font-mono text-slate-500">unknown</span>
          )}
          {edit.user.email ? <span className="text-xs text-slate-400 ml-2">{edit.user.email}</span> : null}
          <span className="text-xs text-slate-400 ml-2">{new Date(edit.createdAt).toLocaleString()}</span>
        </p>
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

        {showNoteInput ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Moderator note</p>
            <Textarea
              rows={3}
              value={moderatorNote}
              onChange={(event) => setModeratorNote(event.target.value)}
              placeholder="Add a note for the contributor..."
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onReview(edit.id, 'APPROVED', moderatorNote)}>Approve</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!showNoteInput) {
                setShowNoteInput(true);
              } else {
                onReview(edit.id, 'REJECTED', moderatorNote);
              }
            }}
          >
            {showNoteInput ? 'Confirm reject' : 'Reject'}
          </Button>
          <Button variant="ghost" onClick={() => setShowNoteInput(!showNoteInput)}>
            {showNoteInput ? 'Hide note' : 'Add note'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

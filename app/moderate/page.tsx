'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DiffView } from '@/components/wiki/DiffView';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';

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
    email: string;
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6">Moderate Edits</h1>

          {edits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">No pending edits</p>
              <p>All caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-6">
              {edits.map((edit) => (
                <EditReviewCard
                  key={edit.id}
                  edit={edit}
                  onReview={handleReview}
                />
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
    <div className="border rounded-lg p-6 bg-gray-50">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {edit.entityType} - {edit.field}
          </h3>
          <p className="text-sm text-gray-600">
            by {edit.user.email} {getUserTrustBadge(edit.user)}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(edit.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Diff:</h4>
        <DiffView
          oldValue={stringifyValue(edit.oldValue)}
          newValue={stringifyValue(edit.newValue)}
        />
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Rationale:</h4>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
          <p className="text-sm">{edit.rationale}</p>
        </div>
      </div>

      {showNoteInput && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moderator Note (optional):
          </label>
          <textarea
            value={moderatorNote}
            onChange={(e) => setModeratorNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add a note for the contributor..."
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onReview(edit.id, 'APPROVED', moderatorNote)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
        >
          ✅ Approve
        </button>
        <button
          onClick={() => {
            if (!showNoteInput) {
              setShowNoteInput(true);
            } else {
              onReview(edit.id, 'REJECTED', moderatorNote);
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
        >
          ❌ {showNoteInput ? 'Confirm Reject' : 'Reject'}
        </button>
        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium"
        >
          💬 Add Note
        </button>
      </div>
    </div>
  );
}

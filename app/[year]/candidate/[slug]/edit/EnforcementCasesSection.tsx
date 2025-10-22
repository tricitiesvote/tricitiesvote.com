'use client';

import { useState } from 'react';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';

interface EnforcementCase {
  id: string;
  caseNumber: string;
  opened: string;
  complainant: string;
  respondent: string;
  subject: string;
  areasOfLaw: string;
  status: string;
  description: string;
  url: string;
  matchConfidence: number | null;
  manuallyReviewed: boolean;
}

interface Props {
  cases: EnforcementCase[];
  candidateId: string;
  onUpdate: () => void;
}

export function EnforcementCasesSection({ cases, candidateId, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [matchConfidence, setMatchConfidence] = useState<number | null>(null);
  const [manuallyReviewed, setManuallyReviewed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = (caseItem: EnforcementCase) => {
    setEditingId(caseItem.id);
    setMatchConfidence(caseItem.matchConfidence);
    setManuallyReviewed(caseItem.manuallyReviewed);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMatchConfidence(null);
    setManuallyReviewed(false);
    setError('');
  };

  const saveEdit = async (caseId: string) => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/admin/enforcement-cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          matchConfidence,
          manuallyReviewed
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEditingId(null);
        onUpdate();
      } else {
        setError(data.error || 'Failed to save changes');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (caseId: string) => {
    if (!confirm('Are you sure you want to unlink this enforcement case from this candidate?')) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/admin/enforcement-cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          candidateId: null,
          matchConfidence: null,
          manuallyReviewed: false
        })
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate();
      } else {
        setError(data.error || 'Failed to unlink case');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (cases.length === 0) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">PDC Enforcement Cases</h2>
        <p className="text-sm text-gray-500">No enforcement cases linked to this candidate.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">PDC Enforcement Cases</h2>
      <p className="text-sm text-gray-600 mb-4">
        Manage enforcement case linkage and review status. Cases are typically linked automatically by import scripts.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="bg-gray-50 p-4 rounded border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <a
                    href={caseItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {caseItem.caseNumber}
                  </a>
                  <span className={`text-xs px-2 py-1 rounded ${
                    caseItem.status === 'Closed' ? 'bg-gray-200 text-gray-700' :
                    caseItem.status === 'Open' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {caseItem.status}
                  </span>
                  {caseItem.manuallyReviewed && (
                    <span className="text-xs px-2 py-1 rounded bg-green-200 text-green-800">
                      Reviewed
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-900 font-medium">{caseItem.subject}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Opened:</span> {new Date(caseItem.opened).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Areas of Law:</span> {caseItem.areasOfLaw}
                  </div>
                  <div>
                    <span className="font-medium">Complainant:</span> {caseItem.complainant}
                  </div>
                  <div>
                    <span className="font-medium">Respondent:</span> {caseItem.respondent}
                  </div>
                  {caseItem.matchConfidence !== null && (
                    <div>
                      <span className="font-medium">Match Confidence:</span> {(caseItem.matchConfidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
                {caseItem.description && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{caseItem.description}</p>
                )}
              </div>
              {editingId !== caseItem.id && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => startEdit(caseItem)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleUnlink(caseItem.id)}
                    disabled={saving}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Unlink
                  </button>
                </div>
              )}
            </div>

            {editingId === caseItem.id && (
              <div className="mt-3 pt-3 border-t border-gray-300 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Match Confidence (0.0 - 1.0)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={matchConfidence ?? ''}
                      onChange={(e) => setMatchConfidence(e.target.value ? Number.parseFloat(e.target.value) : null)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={manuallyReviewed}
                      onChange={(e) => setManuallyReviewed(e.target.checked)}
                      className="mr-2"
                      id={`manually-reviewed-${caseItem.id}`}
                    />
                    <label htmlFor={`manually-reviewed-${caseItem.id}`} className="text-sm text-gray-700">
                      Manually reviewed
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(caseItem.id)}
                    disabled={saving}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

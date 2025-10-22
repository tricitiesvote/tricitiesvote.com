'use client';

import { useState } from 'react';
import { getCsrfToken } from '@/lib/auth';

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
      <section className="admin-section">
        <h2>PDC Enforcement Cases</h2>
        <p style={{ fontSize: '14px', opacity: 0.6 }}>No enforcement cases linked to this candidate.</p>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <h2>PDC Enforcement Cases</h2>
      <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '15px' }}>
        Manage enforcement case linkage and review status. Cases are typically linked automatically by import scripts.
      </p>

      {error && (
        <div className="admin-message-error" style={{ marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <div className="admin-cases">
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="admin-case-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <a href={caseItem.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: 600 }}>
                    {caseItem.caseNumber}
                  </a>
                  <span className={`admin-case-badge ${
                    caseItem.status === 'Closed' ? 'admin-case-badge-closed' :
                    caseItem.status === 'Open' ? 'admin-case-badge-open' :
                    'admin-case-badge-default'
                  }`}>
                    {caseItem.status}
                  </span>
                  {caseItem.manuallyReviewed && (
                    <span className="admin-case-badge admin-case-badge-reviewed">
                      Reviewed
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 10px 0' }}>{caseItem.subject}</p>
                <div className="admin-grid-2" style={{ fontSize: '12px', opacity: 0.8 }}>
                  <div>
                    <strong>Opened:</strong> {new Date(caseItem.opened).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Areas of Law:</strong> {caseItem.areasOfLaw}
                  </div>
                  <div>
                    <strong>Complainant:</strong> {caseItem.complainant}
                  </div>
                  <div>
                    <strong>Respondent:</strong> {caseItem.respondent}
                  </div>
                  {caseItem.matchConfidence !== null && (
                    <div>
                      <strong>Match Confidence:</strong> {(caseItem.matchConfidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
                {caseItem.description && (
                  <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px', lineHeight: '1.4' }}>{caseItem.description}</p>
                )}
              </div>
              {editingId !== caseItem.id && (
                <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
                  <button onClick={() => startEdit(caseItem)} style={{ fontSize: '14px' }}>
                    Edit
                  </button>
                  <button onClick={() => handleUnlink(caseItem.id)} disabled={saving} style={{ fontSize: '14px', color: saving ? '#999' : '#c00' }}>
                    Unlink
                  </button>
                </div>
              )}
            </div>

            {editingId === caseItem.id && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label style={{ fontSize: '12px' }}>Match Confidence (0.0 - 1.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={matchConfidence ?? ''}
                      onChange={(e) => setMatchConfidence(e.target.value ? Number.parseFloat(e.target.value) : null)}
                    />
                  </div>
                  <div className="admin-field-checkbox" style={{ paddingTop: '25px' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={manuallyReviewed}
                        onChange={(e) => setManuallyReviewed(e.target.checked)}
                        id={`manually-reviewed-${caseItem.id}`}
                      />
                      Manually reviewed
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                  <button onClick={() => saveEdit(caseItem.id)} disabled={saving} className="admin-save-button" style={{ fontSize: '13px', padding: '5px 12px' }}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEdit} disabled={saving} style={{ fontSize: '13px', padding: '5px 12px' }}>
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

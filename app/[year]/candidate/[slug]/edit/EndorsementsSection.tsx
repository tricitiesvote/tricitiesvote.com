'use client';

import { useState } from 'react';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';

interface Endorsement {
  id: string;
  endorser: string;
  url: string | null;
  filePath: string | null;
  sourceTitle: string | null;
  notes: string | null;
  type: 'LETTER' | 'SOCIAL' | 'ORG';
  forAgainst: 'FOR' | 'AGAINST';
}

interface Props {
  endorsements: Endorsement[];
  candidateId: string;
  candidateYear: number;
  onUpdate: () => void;
}

type ModalMode = 'add' | 'edit' | null;

export function EndorsementsSection({ endorsements, candidateId, candidateYear, onUpdate }: Props) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingEndorsement, setEditingEndorsement] = useState<Endorsement | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingEndorsement(null);
    setModalMode('add');
  };

  const openEditModal = (endorsement: Endorsement) => {
    setEditingEndorsement(endorsement);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingEndorsement(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endorsement?')) {
      return;
    }

    try {
      setDeleting(id);
      const response = await fetch(`/api/admin/endorsements/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': getCsrfToken()
        }
      });

      if (response.ok) {
        onUpdate();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to delete endorsement'}`);
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setDeleting(null);
    }
  };

  const supportingEndorsements = endorsements.filter(e => e.forAgainst === 'FOR');
  const opposingEndorsements = endorsements.filter(e => e.forAgainst === 'AGAINST');

  return (
    <section className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Endorsements</h2>
        <button onClick={openAddModal} className="admin-save-button" style={{ fontSize: '13px', padding: '6px 14px' }}>
          Add Endorsement
        </button>
      </div>

      {endorsements.length === 0 ? (
        <p style={{ fontSize: '14px', opacity: 0.6 }}>No endorsements found.</p>
      ) : (
        <div className="admin-endorsements">
          {supportingEndorsements.length > 0 && (
            <div className="admin-endorsement-group">
              <h3 style={{ color: '#2d7a2d' }}>Supporting ({supportingEndorsements.length})</h3>
              {supportingEndorsements.map((endorsement) => (
                <EndorsementRow
                  key={endorsement.id}
                  endorsement={endorsement}
                  onEdit={() => openEditModal(endorsement)}
                  onDelete={() => handleDelete(endorsement.id)}
                  deleting={deleting === endorsement.id}
                />
              ))}
            </div>
          )}

          {opposingEndorsements.length > 0 && (
            <div className="admin-endorsement-group">
              <h3 style={{ color: '#c00' }}>Opposing ({opposingEndorsements.length})</h3>
              {opposingEndorsements.map((endorsement) => (
                <EndorsementRow
                  key={endorsement.id}
                  endorsement={endorsement}
                  onEdit={() => openEditModal(endorsement)}
                  onDelete={() => handleDelete(endorsement.id)}
                  deleting={deleting === endorsement.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {modalMode && (
        <EndorsementModal
          mode={modalMode}
          endorsement={editingEndorsement}
          candidateId={candidateId}
          candidateYear={candidateYear}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            onUpdate();
          }}
        />
      )}
    </section>
  );
}

function EndorsementRow({
  endorsement,
  onEdit,
  onDelete,
  deleting
}: {
  endorsement: Endorsement;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="admin-endorsement-item">
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 500, fontSize: '14px', margin: '0 0 8px 0' }}>{endorsement.endorser}</p>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Type:</strong> {endorsement.type}
          </div>
          {endorsement.url && (
            <div style={{ marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>URL:</strong>{' '}
              <a href={endorsement.url} target="_blank" rel="noopener noreferrer">
                {endorsement.url}
              </a>
            </div>
          )}
          {endorsement.filePath && (
            <div style={{ marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>File:</strong>{' '}
              <a href={endorsement.filePath} target="_blank" rel="noopener noreferrer">
                {endorsement.filePath}
              </a>
            </div>
          )}
          {endorsement.sourceTitle && (
            <div style={{ marginBottom: '4px' }}>
              <strong>Source:</strong> {endorsement.sourceTitle}
            </div>
          )}
          {endorsement.notes && (
            <div style={{ marginBottom: '4px' }}>
              <strong>Notes:</strong> {endorsement.notes}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
        <button onClick={onEdit} style={{ fontSize: '14px' }}>
          Edit
        </button>
        <button onClick={onDelete} disabled={deleting} style={{ fontSize: '14px', color: deleting ? '#999' : '#c00' }}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

function EndorsementModal({
  mode,
  endorsement,
  candidateId,
  candidateYear,
  onClose,
  onSuccess
}: {
  mode: 'add' | 'edit';
  endorsement: Endorsement | null;
  candidateId: string;
  candidateYear: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [endorser, setEndorser] = useState(endorsement?.endorser || '');
  const [url, setUrl] = useState(endorsement?.url || '');
  const [file, setFile] = useState<File | null>(null);
  const [sourceTitle, setSourceTitle] = useState(endorsement?.sourceTitle || '');
  const [notes, setNotes] = useState(endorsement?.notes || '');
  const [type, setType] = useState<'LETTER' | 'SOCIAL' | 'ORG'>(endorsement?.type || 'LETTER');
  const [forAgainst, setForAgainst] = useState<'FOR' | 'AGAINST'>(endorsement?.forAgainst || 'FOR');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!endorser.trim()) {
      setError('Endorser name is required');
      return;
    }

    if (mode === 'add' && !url.trim() && !file) {
      setError('Either URL or file upload is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (mode === 'edit' && endorsement) {
        // Update existing endorsement
        const response = await fetch(`/api/admin/endorsements/${endorsement.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({
            endorser: endorser.trim(),
            url: url.trim() || null,
            sourceTitle: sourceTitle.trim() || null,
            notes: notes.trim() || null,
            type,
            forAgainst
          })
        });

        const data = await response.json();

        if (response.ok) {
          onSuccess();
        } else {
          setError(data.error || 'Failed to update endorsement');
        }
      } else {
        // Create new endorsement
        let requestBody: any;
        let headers: any = {
          'X-CSRF-Token': getCsrfToken()
        };

        if (file) {
          // File upload
          const formData = new FormData();
          formData.append('candidateId', candidateId);
          formData.append('endorser', endorser.trim());
          formData.append('type', type);
          formData.append('forAgainst', forAgainst);
          formData.append('file', file);
          if (url.trim()) formData.append('url', url.trim());
          if (sourceTitle.trim()) formData.append('sourceTitle', sourceTitle.trim());
          if (notes.trim()) formData.append('notes', notes.trim());

          requestBody = formData;
        } else {
          // URL-based endorsement
          headers['Content-Type'] = 'application/json';
          requestBody = JSON.stringify({
            candidateId,
            endorser: endorser.trim(),
            url: url.trim(),
            sourceTitle: sourceTitle.trim() || null,
            notes: notes.trim() || null,
            type,
            forAgainst
          });
        }

        const response = await fetch('/api/admin/endorsements', {
          method: 'POST',
          headers,
          body: requestBody
        });

        const data = await response.json();

        if (response.ok) {
          onSuccess();
        } else {
          setError(data.error || 'Failed to create endorsement');
        }
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} className="admin-modal-overlay">
      <div onClick={(e) => e.stopPropagation()} className="admin-modal">
        <div className="admin-modal-header">
          <h3>{mode === 'add' ? 'Add Endorsement' : 'Edit Endorsement'}</h3>
          <button onClick={onClose} style={{ fontSize: '28px', border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.5, lineHeight: 1 }}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-body">
          <div className="admin-field">
            <label>Endorser Name *</label>
            <input
              type="text"
              value={endorser}
              onChange={(e) => setEndorser(e.target.value)}
              placeholder="Organization or Person Name"
            />
          </div>

          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="LETTER">Letter</option>
                <option value="SOCIAL">Social Media</option>
                <option value="ORG">Organization</option>
              </select>
            </div>

            <div className="admin-field">
              <label>Position</label>
              <select value={forAgainst} onChange={(e) => setForAgainst(e.target.value as any)}>
                <option value="FOR">Supporting</option>
                <option value="AGAINST">Opposing</option>
              </select>
            </div>
          </div>

          <div className="admin-field">
            <label>URL {mode === 'add' && !file && '*'}</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/endorsement"
            />
          </div>

          {mode === 'add' && (
            <div className="admin-field">
              <label>Or Upload File (PDF/Image)</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <div className="admin-field">
            <label>Source Title (Optional)</label>
            <input
              type="text"
              value={sourceTitle}
              onChange={(e) => setSourceTitle(e.target.value)}
              placeholder="e.g., Tri-City Herald"
            />
          </div>

          <div className="admin-field">
            <label>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional context or notes"
            />
          </div>

          {error && (
            <div className="admin-message-error">
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
            <button type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="admin-save-button">
              {submitting ? 'Saving...' : mode === 'add' ? 'Add' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

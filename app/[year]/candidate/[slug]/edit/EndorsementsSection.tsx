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
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Endorsements</h2>
        <button
          onClick={openAddModal}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Endorsement
        </button>
      </div>

      {endorsements.length === 0 ? (
        <p className="text-sm text-gray-500">No endorsements found.</p>
      ) : (
        <div className="space-y-6">
          {supportingEndorsements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-700 mb-2">Supporting ({supportingEndorsements.length})</h3>
              <div className="space-y-2">
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
            </div>
          )}

          {opposingEndorsements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2">Opposing ({opposingEndorsements.length})</h3>
              <div className="space-y-2">
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
    <div className="bg-gray-50 p-3 rounded border border-gray-200 flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900">{endorsement.endorser}</p>
        <div className="mt-1 space-y-1 text-xs text-gray-600">
          <div>
            <span className="font-medium">Type:</span> {endorsement.type}
          </div>
          {endorsement.url && (
            <div className="truncate">
              <span className="font-medium">URL:</span>{' '}
              <a href={endorsement.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {endorsement.url}
              </a>
            </div>
          )}
          {endorsement.filePath && (
            <div className="truncate">
              <span className="font-medium">File:</span>{' '}
              <a href={endorsement.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {endorsement.filePath}
              </a>
            </div>
          )}
          {endorsement.sourceTitle && (
            <div>
              <span className="font-medium">Source:</span> {endorsement.sourceTitle}
            </div>
          )}
          {endorsement.notes && (
            <div>
              <span className="font-medium">Notes:</span> {endorsement.notes}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
        >
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
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {mode === 'add' ? 'Add Endorsement' : 'Edit Endorsement'}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endorser Name *
            </label>
            <input
              type="text"
              value={endorser}
              onChange={(e) => setEndorser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Organization or Person Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LETTER">Letter</option>
                <option value="SOCIAL">Social Media</option>
                <option value="ORG">Organization</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                value={forAgainst}
                onChange={(e) => setForAgainst(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FOR">Supporting</option>
                <option value="AGAINST">Opposing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL {mode === 'add' && !file && '*'}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/endorsement"
            />
          </div>

          {mode === 'add' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or Upload File (PDF/Image)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Title (Optional)
            </label>
            <input
              type="text"
              value={sourceTitle}
              onChange={(e) => setSourceTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Tri-City Herald"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional context or notes"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : mode === 'add' ? 'Add' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

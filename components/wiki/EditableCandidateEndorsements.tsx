'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useEditMode } from '@/lib/wiki/EditModeProvider';

interface EditableCandidateEndorsementsProps {
  candidateId: string;
}

type ModalMode = 'FOR_LINK' | 'AGAINST_LINK' | 'FOR_FILE';

type MessageState = {
  type: 'success' | 'error';
  text: string;
};

export function EditableCandidateEndorsements({ candidateId }: EditableCandidateEndorsementsProps) {
  const { user } = useAuth();
  const { editMode } = useEditMode();
  const [modalMode, setModalMode] = useState<ModalMode>('FOR_LINK');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!editMode || !user) {
    return null;
  }

  return (
    <div className="endorsement-suggest">
      <p className="endorsement-suggest__intro">
        Know about a new endorsement or letter? Share it with moderators so we can review and publish it.
      </p>
      <div className="endorsement-suggest__actions">
        <button
          type="button"
          onClick={() => {
            setModalMode('FOR_LINK');
            setIsModalOpen(true);
          }}
          className="endorsement-suggest__button"
        >
          Add 👍 link
        </button>
        <button
          type="button"
          onClick={() => {
            setModalMode('AGAINST_LINK');
            setIsModalOpen(true);
          }}
          className="endorsement-suggest__button"
        >
          Add 👎 link
        </button>
        <button
          type="button"
          onClick={() => {
            setModalMode('FOR_FILE');
            setIsModalOpen(true);
          }}
          className="endorsement-suggest__button"
        >
          Upload 👍 letter
        </button>
      </div>

      <NewEndorsementModal
        candidateId={candidateId}
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

interface NewEndorsementModalProps {
  candidateId: string;
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
}

function NewEndorsementModal({ candidateId, mode, isOpen, onClose }: NewEndorsementModalProps) {
  const forAgainst: 'FOR' | 'AGAINST' = mode === 'AGAINST_LINK' ? 'AGAINST' : 'FOR';
  const isFileMode = mode === 'FOR_FILE';

  const [endorser, setEndorser] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<MessageState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => {
    if (mode === 'FOR_FILE') return 'Upload a supporting endorsement letter';
    return mode === 'FOR_LINK' ? 'Suggest a supporting endorsement link' : 'Suggest an opposition link';
  }, [mode]);

  if (!isOpen) {
    return null;
  }

  const resetAndClose = () => {
    if (submitting) return;
    setEndorser('');
    setUrl('');
    setFile(null);
    setNotes('');
    setMessage(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!endorser.trim()) {
      setMessage({ type: 'error', text: 'Endorser name is required.' });
      return;
    }

    if (isFileMode) {
      if (!file) {
        setMessage({ type: 'error', text: 'Please upload the endorsement letter (PDF or image).' });
        return;
      }
    } else if (!url.trim()) {
      setMessage({ type: 'error', text: 'Please include the link to the endorsement or article.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      let filePath: string | null = null;
      let preparedUrl: string | null = url.trim() ? url.trim() : null;

      if (isFileMode && file) {
        const uploadForm = new FormData();
        uploadForm.append('candidateId', candidateId);
        uploadForm.append('endorser', endorser.trim());
        uploadForm.append('forAgainst', forAgainst);
        uploadForm.append('file', file);
        if (preparedUrl) uploadForm.append('url', preparedUrl);
        if (notes.trim()) uploadForm.append('notes', notes.trim());

        const uploadResponse = await fetch('/api/endorsement-suggestions/upload', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': getCsrfToken()
          },
          body: uploadForm,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload endorsement file');
        }
        filePath = uploadData.filePath ?? null;
        preparedUrl = uploadData.url ?? preparedUrl;
      }

      const rationaleValue = notes.trim() || 'Community endorsement submission.';

      const response = await fetch('/api/edits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          entityType: 'ENDORSEMENT',
          entityId: candidateId,
          field: forAgainst === 'FOR' ? 'endorsement_for' : 'endorsement_against',
          newValue: {
            endorser: endorser.trim(),
            url: preparedUrl,
            filePath,
            notes: notes.trim() || null,
            type: 'LETTER',
            forAgainst
          },
          rationale: rationaleValue
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit endorsement suggestion');
      }

      setMessage({ type: 'success', text: 'Submitted! Thanks for helping keep endorsements current.' });
      setTimeout(() => {
        resetAndClose();
      }, 1800);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={resetAndClose}
      style={overlayStyle}
    >
      <div
        onClick={event => event.stopPropagation()}
        style={modalStyle}
      >
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title}</h3>
          <button type="button" onClick={resetAndClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={bodyStyle}>
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.9rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #dbeafe',
              color: '#1e3a8a',
              fontSize: '0.9rem'
            }}
          >
            <strong>Criteria:</strong>
            <ol style={{ margin: '0.5rem 0 0 1.1rem' }}>
              <li>For/against items must include a written or recorded case all voters can view (letter to the editor, endorsement letter, public social media post).</li>
              <li>Endorsements from political parties are not recognized for non-partisan races. Other endorsements cannot be excluded solely for mentioning parties.</li>
            </ol>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="new-endorsement-endorser">
              Endorser <span style={{ color: '#c00' }}>*</span>
            </label>
            <input
              id="new-endorsement-endorser"
              type="text"
              value={endorser}
              onChange={event => setEndorser(event.target.value)}
              placeholder="Firstname Lastname or Organization Name"
              style={inputStyle}
            />
          </div>

          {isFileMode ? (
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="new-endorsement-file">
                Upload file (PDF or image) <span style={{ color: '#c00' }}>*</span>
              </label>
              <input
                id="new-endorsement-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                onChange={event => setFile(event.target.files?.[0] ?? null)}
                style={inputStyle}
              />
            </div>
          ) : (
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="new-endorsement-url">
                Source link <span style={{ color: '#c00' }}>*</span>
              </label>
              <input
                id="new-endorsement-url"
                type="url"
                value={url}
                onChange={event => setUrl(event.target.value)}
                placeholder="https://example.com/article"
                style={inputStyle}
              />
              <p style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#4b5563' }}>
                Please make sure the link is publicly viewable (no login required).
              </p>
            </div>
          )}

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="new-endorsement-notes">Notes for moderators (optional)</label>
            <textarea
              id="new-endorsement-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              rows={3}
              placeholder="Context for moderators (e.g., publication date, page number)."
              style={textareaStyle}
            />
          </div>

          {message && (
            <div style={message.type === 'success' ? successStyle : errorStyle}>{message.text}</div>
          )}

          <div style={actionsStyle}>
            <button
              type="button"
              onClick={resetAndClose}
              disabled={submitting}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={primaryButtonStyle}>
              {submitting ? 'Submitting…' : 'Submit for review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem'
};

const modalStyle: CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '620px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  position: 'relative'
};

const headerStyle: CSSProperties = {
  padding: '1.5rem',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: 600
};

const closeButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#666',
  padding: 0,
  lineHeight: 1
};

const bodyStyle: CSSProperties = {
  padding: '1.5rem'
};

const formGroupStyle: CSSProperties = {
  marginBottom: '1rem'
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontWeight: 500,
  marginBottom: '0.4rem'
};

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: '6px',
  border: '1px solid #c8c8c8',
  padding: '0.6rem 0.75rem',
  fontSize: '0.95rem',
  lineHeight: 1.4
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '90px',
  resize: 'vertical'
};

const errorStyle: CSSProperties = {
  backgroundColor: '#fdecea',
  border: '1px solid #f5c2c7',
  color: '#c12a32',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  fontSize: '0.9rem'
};

const successStyle: CSSProperties = {
  backgroundColor: '#e3f7e6',
  border: '1px solid #b7e0b9',
  color: '#1c6b2f',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  fontSize: '0.9rem'
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1.25rem'
};

const primaryButtonStyle: CSSProperties = {
  backgroundColor: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '0.6rem 1.2rem',
  fontWeight: 600,
  cursor: 'pointer'
};

const secondaryButtonStyle: CSSProperties = {
  backgroundColor: 'transparent',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '0.6rem 1.1rem',
  fontWeight: 500,
  cursor: 'pointer'
};

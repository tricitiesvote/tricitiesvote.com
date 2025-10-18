'use client';

import { useState } from 'react';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'CANDIDATE' | 'RACE' | 'OFFICE' | 'GUIDE';
  entityId: string;
  field: string;
  value: string;
  label: string;
  multiline?: boolean;
  onSuccess?: () => void;
}

export function EditModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  field,
  value,
  label,
  multiline = false,
  onSuccess
}: EditModalProps) {
  const [editValue, setEditValue] = useState(value);
  const [rationale, setRationale] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rationale.trim()) {
      setError('Please provide a rationale for your change');
      return;
    }

    if (editValue === value) {
      setError('No changes detected');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/edits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          entityType,
          entityId,
          field,
          newValue: editValue,
          rationale
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess?.();
        onClose();
      } else {
        setError(data.error || 'Failed to submit edit');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEditValue(value);
    setRationale('');
    setError('');
    onClose();
  };

  return (
    <>
      {/* Modal overlay */}
      <div
        className="wiki-modal-overlay"
        onClick={handleClose}
        style={{
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
        }}
      >
        {/* Modal content */}
        <div
          className="wiki-modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              Edit {label}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            <div className="wiki-modal-form">
              <div className="wiki-form-group">
                <label className="wiki-form-label">
                  New value
                </label>
                {multiline ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={6}
                    className="wiki-form-control"
                  />
                ) : (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="wiki-form-control"
                  />
                )}
              </div>

              <div className="wiki-form-group">
                <label className="wiki-form-label">
                  Rationale for change <span style={{ color: '#c00' }}>*</span>
                </label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why this change is needed..."
                  rows={3}
                  className="wiki-form-control"
                  required
                />
              </div>

              {error && (
                <div className="wiki-form-error">
                  {error}
                </div>
              )}

              <div className="wiki-form-actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="wiki-btn wiki-btn-primary"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Change'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="wiki-btn wiki-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal-specific styles */}
      <style jsx>{`
        .wiki-modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .wiki-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .wiki-form-label {
          font-weight: 500;
          font-size: 0.95rem;
          color: #333;
        }

        .wiki-form-control {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.5;
          transition: border-color 0.15s ease-in-out;
        }

        .wiki-form-control:focus {
          outline: none;
          border-color: #4a90e2;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }

        .wiki-form-error {
          padding: 0.75rem;
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          color: #c00;
          font-size: 0.9rem;
        }

        .wiki-form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 0.5rem;
        }

        .wiki-btn {
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 4px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }

        .wiki-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .wiki-btn-primary {
          background-color: #28a745;
          color: white;
        }

        .wiki-btn-primary:hover:not(:disabled) {
          background-color: #218838;
        }

        .wiki-btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .wiki-btn-secondary:hover:not(:disabled) {
          background-color: #5a6268;
        }

        @media (max-width: 640px) {
          .wiki-modal-content {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .wiki-form-actions {
            flex-direction: column-reverse;
          }

          .wiki-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

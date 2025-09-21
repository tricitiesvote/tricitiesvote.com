'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';
import { useEditMode } from '@/lib/wiki/EditModeProvider';

interface EditableFieldProps {
  entityType: 'CANDIDATE' | 'RACE' | 'OFFICE' | 'GUIDE';
  entityId: string;
  field: string;
  value?: string | null;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  renderDisplay?: (value: string) => ReactNode;
  as?: 'div' | 'span';
  children?: ReactNode;
}

export function EditableField({
  entityType,
  entityId,
  field,
  value,
  placeholder,
  multiline = false,
  className = '',
  renderDisplay,
  as = multiline ? 'div' : 'span',
  children
}: EditableFieldProps) {
  const { user } = useAuth();
  const { editMode } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const baseValue = value ?? '';
  const [editValue, setEditValue] = useState(baseValue);
  const [rationale, setRationale] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rationale.trim()) {
      setError('Please provide a rationale for your change');
      return;
    }

    if (editValue === baseValue) {
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
        setSuccess(true);
        setIsEditing(false);
        setRationale('');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to submit edit');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(baseValue);
    setRationale('');
    setError('');
  };

  const currentValue = baseValue;

  useEffect(() => {
    if (!isEditing) {
      setEditValue(baseValue);
    }
  }, [baseValue, isEditing]);

  const Wrapper = as === 'span' ? 'span' : 'div';

  const displayContent = children
    ?? (renderDisplay ? renderDisplay(currentValue) : currentValue || placeholder);

  if (!editMode) {
    return (
      <Wrapper className={className}>
        {displayContent}
      </Wrapper>
    );
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Explain why this change is needed..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          required
        />

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Change'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group relative">
      <Wrapper className={className}>
        {displayContent}
      </Wrapper>

      {user && editMode && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit this field"
        >
          ✏️
        </button>
      )}

      {success && (
        <div className="absolute -top-8 left-0 bg-green-100 border border-green-300 text-green-700 px-2 py-1 rounded text-sm">
          Edit submitted for review!
        </div>
      )}
    </div>
  );
}

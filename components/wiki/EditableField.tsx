'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useEditMode } from '@/lib/wiki/EditModeProvider';
import { EditModal } from './EditModal';

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
  // New props for better UX
  label?: string; // Label for the modal
  showPencilInline?: boolean; // Show pencil next to content (for contact fields)
  renderTrigger?: (openModal: () => void) => ReactNode;
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
  children,
  label,
  showPencilInline = false,
  renderTrigger
}: EditableFieldProps) {
  const { user, refreshUser } = useAuth();
  const { editMode } = useEditMode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const baseValue = value ?? '';
  const openModal = () => setIsModalOpen(true);

  const Wrapper = as === 'span' ? 'span' : 'div';

  const displayContent = children
    ?? (renderDisplay ? renderDisplay(baseValue) : baseValue || placeholder);

  const handleSuccess = () => {
    setSuccess(true);
    refreshUser().catch(() => {
      // Non-fatal; the pending counter will refresh on next auth fetch
    });
    setTimeout(() => setSuccess(false), 3000);
  };

  if (!editMode) {
    return (
      <Wrapper className={className}>
        {displayContent}
      </Wrapper>
    );
  }

  // For inline pencil (contact fields)
  if (showPencilInline) {
    return (
      <>
        <Wrapper
          className={className}
          style={{ display: 'inline', cursor: 'pointer' }}
          onClick={openModal}
        >
          {displayContent}
        </Wrapper>
        {user && editMode && (
          <button
            onClick={openModal}
            title={`Edit ${label || field}`}
            style={{
              marginLeft: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9em',
              opacity: 0.6,
              verticalAlign: 'middle'
            }}
          >
            ✏️
          </button>
        )}
        <EditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          entityType={entityType}
          entityId={entityId}
          field={field}
          value={baseValue}
          label={label || field}
          multiline={multiline}
          onSuccess={handleSuccess}
        />
        {success && (
          <div style={{
            display: 'inline-block',
            marginLeft: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '3px',
            fontSize: '0.8em',
            color: '#155724'
          }}>
            ✓ Submitted
          </div>
        )}
        {renderTrigger && editMode && (
          <div style={{ display: 'inline-block', marginLeft: '0.5rem' }}>
            {renderTrigger(openModal)}
          </div>
        )}
      </>
    );
  }

  // Default: for sections/blocks - make clickable in edit mode
  return (
    <>
      <Wrapper
        className={className}
        onClick={user && editMode ? openModal : undefined}
        style={user && editMode ? { cursor: 'pointer' } : undefined}
      >
        {displayContent}
      </Wrapper>
      {renderTrigger && editMode && (
        <div style={{ marginTop: '0.5rem' }}>
          {renderTrigger(openModal)}
        </div>
      )}
      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType={entityType}
        entityId={entityId}
        field={field}
        value={baseValue}
        label={label || field}
        multiline={multiline}
        onSuccess={handleSuccess}
      />
      {success && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '3px',
          fontSize: '0.9em',
          color: '#155724'
        }}>
          Edit submitted for review!
        </div>
      )}
    </>
  );
}

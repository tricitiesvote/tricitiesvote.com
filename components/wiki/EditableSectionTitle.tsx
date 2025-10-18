'use client';

import { useState, ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useEditMode } from '@/lib/wiki/EditModeProvider';
import { EditModal } from './EditModal';

interface EditableSectionTitleProps {
  title: string;
  entityType: 'CANDIDATE' | 'RACE' | 'OFFICE' | 'GUIDE';
  entityId: string;
  field: string;
  value: string;
  label: string;
  multiline?: boolean;
  onSuccess?: () => void;
  renderTrigger?: (openModal: () => void) => ReactNode;
}

export function EditableSectionTitle({
  title,
  entityType,
  entityId,
  field,
  value,
  label,
  multiline = false,
  onSuccess,
  renderTrigger
}: EditableSectionTitleProps) {
  const { user, refreshUser } = useAuth();
  const { editMode } = useEditMode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSuccess = () => {
    setSuccess(true);
    refreshUser().catch(() => {});
    onSuccess?.();
    setTimeout(() => setSuccess(false), 3000);
  };

  if (!editMode || !user) {
    return <h4>{title}</h4>;
  }

  return (
    <>
      <h4
        onClick={() => setIsModalOpen(true)}
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        title={`Click to edit ${label}`}
      >
        <span style={{ opacity: 0.6, fontSize: '0.9em' }}>✏️</span>
        {title}
      </h4>
      {renderTrigger && (
        <div style={{ display: 'inline-block', marginLeft: '0.75rem' }}>
          {renderTrigger(() => setIsModalOpen(true))}
        </div>
      )}
      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType={entityType}
        entityId={entityId}
        field={field}
        value={value}
        label={label}
        multiline={multiline}
        onSuccess={handleSuccess}
      />
      {success && (
        <div style={{
          marginTop: '0.5rem',
          marginBottom: '0.5rem',
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

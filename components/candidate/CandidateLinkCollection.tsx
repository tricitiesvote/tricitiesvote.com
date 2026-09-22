'use client';

import { EditableField } from '@/components/wiki/EditableField'
import { useEditMode } from '@/lib/wiki/EditModeProvider'
import { useAuth } from '@/lib/auth/AuthProvider'
import { cn } from '@/lib/utils'

interface CandidateLinkCollectionProps {
  candidateId: string
  email?: string | null
  website?: string | null
  facebook?: string | null
  twitter?: string | null
  instagram?: string | null
  youtube?: string | null
  pdc?: string | null
  votesmart?: string | null
  phone?: string | null
  variant?: 'stacked' | 'inline'
}

export function CandidateLinkCollection({
  candidateId,
  email,
  website,
  facebook,
  twitter,
  instagram,
  youtube,
  pdc,
  votesmart,
  phone,
  variant = 'stacked'
}: CandidateLinkCollectionProps) {
  const { editMode } = useEditMode();
  const { user } = useAuth();
  const showEditControls = Boolean(editMode && user);

  const contactFields = [
    {
      field: 'email',
      value: email ?? '',
      label: 'Email',
      icon: '✉️',
      readonly: false,
      render: (value: string) => (
        <a href={`mailto:${value}`}>
          Email
        </a>
      )
    },
    // Commented out for municipal elections - can enable for statewide
    // {
    //   field: 'phone',
    //   value: phone ?? '',
    //   label: 'Phone',
    //   icon: '📞',
    //   readonly: false,
    //   render: (value: string) => <span>{value}</span>
    // },
    {
      field: 'website',
      value: website ?? '',
      label: 'Website',
      icon: '🌐',
      readonly: false,
      render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer">
          Website
        </a>
      )
    },
    {
      field: 'facebook',
      value: facebook ?? '',
      label: 'Facebook',
      readonly: false,
      icon: '👤',
      render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
      )
    },
    {
      field: 'twitter',
      value: twitter ?? '',
      label: 'Twitter',
      icon: '🐦',
      readonly: false,
      render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer">
          Twitter/X
        </a>
      )
    },
    {
      field: 'instagram',
      value: instagram ?? '',
      label: 'Instagram',
      icon: '📷',
      readonly: false,
      render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
      )
    },
    {
      field: 'youtube',
      value: youtube ?? '',
      label: 'YouTube',
      icon: '📺',
      render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer">
          YouTube
        </a>
      )
    },
    {
      field: 'pdc',
      value: pdc ?? '',
      label: 'Finance',
      icon: '💰',
      readonly: true,
      render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer">
          Finance
        </a>
      )
    },
    {
      field: 'votesmart',
      value: votesmart ?? '',
      label: 'Vote Smart',
      icon: '📋',
      readonly: true,
      render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer">
          Vote Smart
        </a>
      )
    }
  ]

  const hasAnyValue = contactFields.some(field => field.value)
  const listClassName = cn(
    'candidate-links',
    variant === 'inline' && 'candidate-links-inline'
  )

  return (
    <ul className={listClassName}>
      {!hasAnyValue && (
        <li className="text-gray-500">Contact info N/A.</li>
      )}
      {contactFields.map(({ field, value, icon, render, readonly, label }) => {
        // In normal view, skip empty fields
        if (!showEditControls && !value) {
          return null;
        }

        return (
          <li key={field} className="candidate-link-item">
            <span className="link-item-icon">{icon}</span>
            {readonly ? (
              value ? (
                render(value)
              ) : (
                <span className="text-gray-500">{label} link N/A.</span>
              )
            ) : (
              <EditableField
                entityType="CANDIDATE"
                entityId={candidateId}
                field={field}
                value={value}
                placeholder={`${label} N/A.`}
                label={label}
                as="span"
                showPencilInline={showEditControls}
              >
                {value ? render(value) : <span className="text-gray-500">{label} N/A.</span>}
              </EditableField>
            )}
          </li>
        );
      })}
    </ul>
  )
}

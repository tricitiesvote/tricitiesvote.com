'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DiffView } from '@/components/wiki/DiffView';
import { timeAgo, getEntityBadgeClass, getTrustIndicator } from '@/lib/wiki/helpers';
import { cn } from '@/lib/utils';

interface WikiEdit {
  id: string;
  field: string;
  entityType: string;
  entityId: string;
  rationale: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'SUPERSEDED';
  createdAt: string;
  reviewedAt?: string | null;
  moderatorNote?: string | null;
  oldValue: any;
  newValue: any;
  user: {
    id: string;
    email: string | null;
    name?: string | null;
    role: string;
    publicId?: string | null;
    editsAccepted?: number;
    editsRejected?: number;
    editsPending?: number;
  };
  moderator?: {
    id: string;
    email: string;
    name?: string | null;
    publicId?: string | null;
    role?: string | null;
  } | null;
}

interface EditQueueCardProps {
  edit: WikiEdit;
  onReview: (id: string, status: 'APPROVED' | 'REJECTED', note?: string) => Promise<{ success: boolean; error?: string }>;
  defaultExpanded?: boolean;
}

function stringifyValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function EditQueueCard({ edit, onReview, defaultExpanded = false }: EditQueueCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [showNoteField, setShowNoteField] = useState(false);
  const [moderatorNote, setModeratorNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createdDate = new Date(edit.createdAt);
  const timeAgoStr = timeAgo(createdDate);

  const trustInfo = getTrustIndicator(
    edit.user.editsAccepted ?? 0,
    edit.user.editsRejected ?? 0,
    edit.user.editsPending ?? 0
  );

  const entityBadgeClass = getEntityBadgeClass(edit.entityType);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    setIsSubmitting(true);
    setError('');

    const result = await onReview(edit.id, status, moderatorNote || undefined);

    if (!result.success) {
      setError(result.error || 'Failed to process edit');
      setIsSubmitting(false);
    }
    // On success, the parent will remove this card from the list
  };

  // Collapsed preview content
  const previewContent = (
    <div className="flex items-start justify-between gap-4 py-4 px-6 hover:bg-slate-50 transition-colors cursor-pointer">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn('text-xs font-semibold uppercase', entityBadgeClass)}>
            {edit.entityType}
          </Badge>
          <span className="text-sm font-medium text-slate-700">{edit.field}</span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500">{timeAgoStr}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          {trustInfo.icon && <span>{trustInfo.icon}</span>}
          <span className="font-mono text-xs">{edit.user.email || 'Unknown'}</span>
          <span className={cn('text-xs', trustInfo.className)}>
            ({edit.user.editsAccepted ?? 0}✓ {edit.user.editsRejected ?? 0}✗ {edit.user.editsPending ?? 0}⏳)
          </span>
        </div>

        <p className="text-sm text-slate-500 italic line-clamp-1">
          &ldquo;{edit.rationale}&rdquo;
        </p>
      </div>

      <div className="text-right text-xs text-slate-400">
        {isOpen ? '▼' : '▶'}
      </div>
    </div>
  );

  // Expanded content
  const expandedContent = (
    <CardContent className="space-y-6 pt-0 pb-6 px-6">
      {/* Entity Context */}
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Editing</div>
        <div className="text-sm">
          <span className="font-medium text-slate-700">{edit.entityType}</span>
          <span className="text-slate-400 mx-2">•</span>
          <span className="font-mono text-xs text-slate-600">{edit.entityId.slice(0, 12)}...</span>
        </div>
      </div>

      {/* User Context with Link */}
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Contributor</div>
        <div className="flex items-center gap-2">
          {trustInfo.icon && <span className="text-lg">{trustInfo.icon}</span>}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-slate-900">{edit.user.email || 'Unknown'}</span>
              <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                {edit.user.role}
              </Badge>
              <span className={cn('text-xs font-medium', trustInfo.className)}>
                {trustInfo.label}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {edit.user.editsAccepted ?? 0} accepted • {edit.user.editsRejected ?? 0} rejected • {edit.user.editsPending ?? 0} pending
            </div>
          </div>
          {edit.user.publicId && (
            <Link
              href={`/edits/user/${edit.user.publicId}`}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              target="_blank"
            >
              View history →
            </Link>
          )}
        </div>
      </div>

      {/* Diff View */}
      <div>
        <div className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-3">Changes</div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <DiffView
            oldValue={stringifyValue(edit.oldValue)}
            newValue={stringifyValue(edit.newValue)}
          />
        </div>
      </div>

      {/* Rationale */}
      <div>
        <div className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">Rationale</div>
        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 whitespace-pre-wrap">
          {edit.rationale}
        </div>
      </div>

      {/* Moderator Note Field (conditional) */}
      {showNoteField && (
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">
            Moderator Note (optional)
          </div>
          <Textarea
            rows={3}
            value={moderatorNote}
            onChange={(e) => setModeratorNote(e.target.value)}
            placeholder="Add context for the contributor..."
            className="text-sm"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => handleAction('APPROVED')}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? 'Processing...' : '✅ Approve'}
        </Button>

        <Button
          onClick={() => {
            if (!showNoteField) {
              setShowNoteField(true);
              return;
            }
            handleAction('REJECTED');
          }}
          disabled={isSubmitting}
          variant="destructive"
        >
          {isSubmitting ? 'Processing...' : '❌ Reject'}
        </Button>

        <Button
          onClick={() => setShowNoteField(!showNoteField)}
          variant="ghost"
          size="sm"
        >
          {showNoteField ? 'Hide note' : '💬 Add note'}
        </Button>
      </div>
    </CardContent>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CollapsibleTrigger asChild>
          <div>{previewContent}</div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {expandedContent}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

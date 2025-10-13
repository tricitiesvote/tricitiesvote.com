'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DiffView } from '@/components/wiki/DiffView';
import type { SerializedEdit } from '@/lib/wiki/editQueries';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

type ViewerRole = 'COMMUNITY' | 'CANDIDATE' | 'MODERATOR' | 'ADMIN' | null | undefined;

interface EditLogTableProps {
  title?: string;
  pinnedEdits?: SerializedEdit[];
  edits: SerializedEdit[];
  showContributorColumn?: boolean;
  showEntityColumn?: boolean;
  emptyMessage?: string;
  viewerRole?: ViewerRole;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Declined',
  APPLIED: 'Applied',
  SUPERSEDED: 'Superseded'
};

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  PENDING: { variant: 'secondary', className: 'bg-amber-100 text-amber-900 border-amber-200' },
  APPROVED: { variant: 'default', className: 'bg-emerald-500 text-white border-transparent' },
  REJECTED: { variant: 'destructive' },
  APPLIED: { variant: 'default', className: 'bg-blue-600 text-white border-transparent' },
  SUPERSEDED: { variant: 'outline' }
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function getPreview(value: unknown) {
  const stringValue = stringifyValue(value).replace(/\s+/g, ' ').trim();
  if (!stringValue) return '—';
  if (stringValue.length <= 120) return stringValue;
  return `${stringValue.slice(0, 117)}…`;
}

function RoleBadge({ role }: { role: string | null | undefined }) {
  if (!role) return null;
  const copy = role.toLowerCase();
  if (copy === 'admin') return <span className="ml-2 text-xs font-medium text-purple-600">admin</span>;
  if (copy === 'moderator') return <span className="ml-2 text-xs font-medium text-blue-600">moderator</span>;
  return null;
}

function ContributorDisplay({
  edit,
  viewerRole
}: {
  edit: SerializedEdit;
  viewerRole?: ViewerRole;
}) {
  if (!edit.user?.publicId) {
    return <span className="text-slate-400">Unknown user</span>;
  }

  const shortId = edit.user.publicId.slice(0, 6);
  const showEmailHint = viewerRole && ['MODERATOR', 'ADMIN'].includes(viewerRole) ? edit.user : null;

  return (
    <div className="flex flex-col">
      <Link className="text-blue-600 hover:text-blue-700 font-medium" href={`/edits/user/${edit.user.publicId}`}>
        {shortId}
      </Link>
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <span>{edit.user.editsAccepted} accepted</span>
        <span aria-hidden>·</span>
        <span>{edit.user.editsRejected} declined</span>
        <RoleBadge role={edit.user.role} />
      </div>
      {showEmailHint ? (
        <span className="text-xs text-slate-400">Email visible in moderation tools</span>
      ) : null}
    </div>
  );
}

function EntityBadge({ edit }: { edit: SerializedEdit }) {
  return <span className="text-xs font-mono text-slate-500">{edit.entityType} · {edit.entityId.slice(0, 6)}</span>;
}

function ModeratorDisplay({ edit }: { edit: SerializedEdit }) {
  if (!edit.moderator?.publicId) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const shortId = edit.moderator.publicId.slice(0, 6);
  return (
    <div className="flex flex-col">
      <Link className="text-blue-600 hover:text-blue-700 font-medium" href={`/edits/user/${edit.moderator.publicId}`}>
        {shortId}
      </Link>
      <RoleBadge role={edit.moderator.role} />
    </div>
  );
}

function EditRow({
  edit,
  viewerRole,
  showContributor,
  showEntity
}: {
  edit: SerializedEdit;
  viewerRole?: ViewerRole;
  showContributor?: boolean;
  showEntity?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusLabel = STATUS_LABELS[edit.status] ?? edit.status;
  const badgeConfig = STATUS_BADGES[edit.status] ?? STATUS_BADGES.SUPERSEDED;

  return (
    <>
      <TableRow className="border-slate-100" key={edit.id}>
        <TableCell className="text-xs text-slate-500" style={{ width: 140 }}>
          {formatDateTime(edit.createdAt)}
        </TableCell>
        <TableCell style={{ width: 120 }}>
          <Badge variant={badgeConfig.variant} className={cn('capitalize', badgeConfig.className)}>
            {statusLabel}
          </Badge>
        </TableCell>
        <TableCell className="align-top">
          <div className="font-medium text-slate-900">{edit.field}</div>
          <p className="text-xs text-slate-500 mt-1">{getPreview(edit.newValue)}</p>
        </TableCell>
        {showEntity ? (
          <TableCell className="text-xs text-slate-500" style={{ width: 160 }}>
            <EntityBadge edit={edit} />
          </TableCell>
        ) : null}
        {showContributor ? (
          <TableCell style={{ width: 160 }}>
            <ContributorDisplay edit={edit} viewerRole={viewerRole} />
          </TableCell>
        ) : null}
        <TableCell style={{ width: 140 }}>
          <ModeratorDisplay edit={edit} />
        </TableCell>
        <TableCell className="text-right" style={{ width: 120 }}>
          <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Hide details' : 'View details'}
          </Button>
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow className="bg-slate-50/80">
          <TableCell colSpan={showContributor && showEntity ? 7 : showContributor || showEntity ? 6 : 5} className="p-0">
            <div className="px-6 py-4 space-y-4 text-sm text-slate-700">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Contributor rationale</p>
                <p className="whitespace-pre-wrap text-slate-700 mt-1">{edit.rationale || '—'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">Diff preview</p>
                <DiffView oldValue={stringifyValue(edit.oldValue)} newValue={stringifyValue(edit.newValue)} />
              </div>
              {edit.moderatorNote ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1">Moderator note</p>
                  <p className="whitespace-pre-wrap text-slate-700">{edit.moderatorNote}</p>
                </div>
              ) : null}
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function EditLogTable({
  title,
  pinnedEdits = [],
  edits,
  showContributorColumn = true,
  showEntityColumn = true,
  emptyMessage = 'No edits found',
  viewerRole
}: EditLogTableProps) {
  if (!pinnedEdits.length && !edits.length) {
    return (
      <Alert className="bg-white">
        <AlertTitle>No edits found</AlertTitle>
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {title ? <h2 className="text-xl font-semibold text-slate-900">{title}</h2> : null}

      {pinnedEdits.length ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
              Pending edits awaiting moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableBody>
                {pinnedEdits.map((edit) => (
                  <EditRow
                    key={`pinned-${edit.id}`}
                    edit={edit}
                    showContributor={showContributorColumn}
                    showEntity={showEntityColumn}
                    viewerRole={viewerRole}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {edits.length ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Field</TableHead>
                  {showEntityColumn ? <TableHead>Entity</TableHead> : null}
                  {showContributorColumn ? <TableHead>Contributor</TableHead> : null}
                  <TableHead>Moderator</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {edits.map((edit) => (
                  <EditRow
                    key={edit.id}
                    edit={edit}
                    showContributor={showContributorColumn}
                    showEntity={showEntityColumn}
                    viewerRole={viewerRole}
                  />
                ))}
              </TableBody>
            </Table>
            <TableCaption className="text-xs text-slate-400">
              Most recent updates first. Expand rows to see rationales and diffs.
            </TableCaption>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

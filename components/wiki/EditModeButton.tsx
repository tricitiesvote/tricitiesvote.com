'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useEditMode } from '@/lib/wiki/EditModeProvider';
import { usePathname } from 'next/navigation';

export function EditModeButton() {
  const { user, logout, isLoading } = useAuth();
  const { editMode, toggleEditMode } = useEditMode();
  const pathname = usePathname();

  // Hide completely if no user is logged in
  if (!user || isLoading) {
    return null;
  }

  const isModerator = ['MODERATOR', 'ADMIN'].includes(user.role);
  const isAdmin = user.role === 'ADMIN';
  const roleIcon =
    user.role === 'ADMIN' ? '👑' :
    user.role === 'MODERATOR' ? '🛡️' :
    user.role === 'CANDIDATE' ? '🎯' : '👤';

  // Detect if we're on a candidate page and extract year/slug
  const candidatePageMatch = pathname?.match(/^\/(\d{4})\/candidate\/([^\/]+)$/);
  const isCandidatePage = candidatePageMatch && candidatePageMatch.length === 3;
  const editUrl = isCandidatePage ? `${pathname}/edit` : null;

  return (
    <div className="wiki-controls">
      <div className="">
          <button
            onClick={toggleEditMode}
            className={`transition-colors ${
              editMode ? '' : ''
            }`}
          >
            {editMode ? 'Exit Edit Mode' : 'Suggest edit'}
          </button>
        {isAdmin && isCandidatePage && editUrl && (
          <button onClick={() => window.location.href = editUrl}>
            Edit
          </button>
        )}
        {isModerator ? (
          <span>
            <a
              href="/admin/wiki"
              className=""
            >
              Admin
            </a>
          </span>
        ) : null}
          {/* <span className="">
            {roleIcon}
            <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}></span>
          </span> */}
          <span className="">
            <a
              href={`/edits/user/${user.publicId}`}
              className=""
              title={user.email}
            >
              My edits
            </a>
          </span>
          <span className="">
            {/* <a href={`/edits/user/${user.publicId}/accepted`} className="hover:text-white">
              {user.editsAccepted} accepted
            </a> */}
            <a href={`/edits/user/${user.publicId}/pending`} className="hover:text-white">
              {user.editsPending} pending
            </a>
          </span>
          <button
            onClick={() => logout()}
            className="logout-button"
          >
            Log out
          </button>
        </div>
    </div>
  );
}

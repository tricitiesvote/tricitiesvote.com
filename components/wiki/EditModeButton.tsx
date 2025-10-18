'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useEditMode } from '@/lib/wiki/EditModeProvider';

export function EditModeButton() {
  const { user, logout, isLoading } = useAuth();
  const { editMode, toggleEditMode } = useEditMode();

  // Hide completely if no user is logged in
  if (!user || isLoading) {
    return null;
  }

  const isModerator = ['MODERATOR', 'ADMIN'].includes(user.role);
  const roleIcon =
    user.role === 'ADMIN' ? '👑' :
    user.role === 'MODERATOR' ? '🛡️' :
    user.role === 'CANDIDATE' ? '🎯' : '👤';

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
        {isModerator ? (
          <a
            href="/admin/wiki"
            className=""
          >
            Admin
          </a>
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

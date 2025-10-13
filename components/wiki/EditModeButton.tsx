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
    <div className="w-full bg-slate-900 text-white text-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleEditMode}
            className={`px-3 py-2 rounded-md font-medium transition-colors ${
              editMode ? 'bg-green-500 hover:bg-green-400' : 'bg-blue-500 hover:bg-blue-400'
            }`}
          >
            {editMode ? 'Exit Edit Mode' : 'Suggest Changes'}
          </button>

        <div className="flex flex-col md:flex-row md:items-center md:gap-3 text-slate-200">
            <span className="flex items-center gap-2">
              {roleIcon}
              <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
            </span>
            <span className="text-xs text-slate-300">
              Contributor ID:{' '}
              <a
                href={`/edits/user/${user.publicId}`}
                className="text-blue-200 hover:text-blue-100"
              >
                {user.publicId.slice(0, 6)}
              </a>
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-2">
              <a href={`/edits/user/${user.publicId}/accepted`} className="hover:text-white">
                {user.editsAccepted} accepted
              </a>
              <span aria-hidden>•</span>
              <a href={`/edits/user/${user.publicId}/pending`} className="hover:text-white">
                {user.editsPending} pending
              </a>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-200">
          {isModerator ? (
            <a
              href="/admin/wiki"
              className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md font-medium"
            >
              Admin console
            </a>
          ) : null}
          <button
            onClick={() => logout()}
            className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md font-medium"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

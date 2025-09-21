'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useEditMode } from '@/lib/wiki/EditModeProvider';

export function EditModeButton() {
  const { user } = useAuth();
  const { editMode, toggleEditMode } = useEditMode();

  if (!user) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <a
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md"
        >
          Sign in to Edit
        </a>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 items-center">
      <button
        onClick={toggleEditMode}
        className={`px-4 py-2 rounded-md text-sm font-medium shadow-md transition-colors ${
          editMode
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {editMode ? 'Exit Edit Mode' : 'Suggest Changes'}
      </button>

      {user && (
        <div className="bg-white border rounded-md px-3 py-2 text-sm shadow-md">
          <span className="text-gray-600">
            {user.role === 'ADMIN' ? '👑' :
             user.role === 'MODERATOR' ? '🛡️' :
             user.role === 'CANDIDATE' ? '🎯' : '👤'}
            {user.email}
          </span>
          <div className="text-xs text-gray-500">
            {user.editsAccepted} accepted, {user.editsPending} pending
          </div>
        </div>
      )}
    </div>
  );
}
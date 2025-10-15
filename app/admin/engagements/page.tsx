'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { EngagementManager } from '@/components/wiki/EngagementManager';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function EngagementAdminPage() {
  const { user, isLoading } = useAuth();

  const isAuthorized = useMemo(
    () => Boolean(user && ['MODERATOR', 'ADMIN'].includes(user.role)),
    [user]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium mb-2">Authentication required</h1>
          <p className="text-sm text-gray-600 mb-4">Sign in to access engagement tools.</p>
          <a href="/login" className="text-sm text-blue-600 hover:underline">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium mb-2">Access denied</h1>
          <p className="text-sm text-gray-600">Moderators and admins only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <h1 className="font-medium text-gray-900">Engagement Manager</h1>
            <Link href="/admin/wiki" className="text-blue-600 hover:underline">
              Back to wiki admin
            </Link>
            <Link href="/edits" className="text-blue-600 hover:underline">
              Audit trail
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-gray-600">{user.email}</span>
            <span className="text-xs text-gray-400">{user.role}</span>
            <button
              onClick={() => (window.location.href = '/logout')}
              className="text-gray-500 hover:text-gray-700"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <EngagementManager />
      </main>
    </div>
  );
}

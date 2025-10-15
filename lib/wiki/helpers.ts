/**
 * Format a date as a human-readable "time ago" string
 */
export function timeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
}

/**
 * Get badge color classes based on entity type
 */
export function getEntityBadgeClass(entityType: string): string {
  switch (entityType) {
    case 'CANDIDATE':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'RACE':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'OFFICE':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'GUIDE':
      return 'bg-teal-100 text-teal-700 border-teal-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Get status badge color classes
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'APPROVED':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'APPLIED':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'SUPERSEDED':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Get trust level indicator based on user stats
 */
export function getTrustIndicator(accepted: number, rejected: number, pending: number): {
  icon: string;
  label: string;
  className: string;
} {
  const total = accepted + rejected;
  const rejectRate = total > 0 ? rejected / total : 0;

  if (accepted === 0) {
    return {
      icon: '⚠️',
      label: 'New',
      className: 'text-gray-500'
    };
  }

  if (rejectRate > 0.3) {
    return {
      icon: '⚠️',
      label: 'Caution',
      className: 'text-yellow-600'
    };
  }

  if (accepted >= 3 && rejectRate < 0.1) {
    return {
      icon: '✓',
      label: 'Trusted',
      className: 'text-green-600'
    };
  }

  return {
    icon: '',
    label: 'Learning',
    className: 'text-gray-600'
  };
}

/**
 * Construct entity page URL from entity type and ID
 * Note: For candidates, we need the slug which requires a lookup
 */
export function getEntityUrl(entityType: string, entityId: string, year?: number): string | null {
  // We'll need to enhance this with actual slug lookups
  // For now, return null to indicate we need more data
  return null;
}

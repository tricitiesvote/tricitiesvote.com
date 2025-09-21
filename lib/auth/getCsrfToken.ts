export function getCsrfToken(): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=');
    if (rawName === 'csrf-token') {
      return decodeURIComponent(rest.join('='));
    }
  }
  return '';
}

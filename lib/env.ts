import 'server-only';

/**
 * Returns the base URL that should be used when issuing server-to-server requests
 * (e.g., calling other API routes within this Next.js app).
 */
export function getAppBaseUrl() {
  if (process.env.DASHBOARD_API_BASE) {
    return process.env.DASHBOARD_API_BASE.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}

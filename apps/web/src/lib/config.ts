// Central place for deployment-dependent URLs.
// NEXT_PUBLIC_* values are inlined at build time: change them in Vercel, then redeploy.

const isProd = process.env.NODE_ENV === 'production';
const clean = (value?: string) => (value || '').trim().replace(/\/+$/, '');

export const API_URL =
  clean(process.env.NEXT_PUBLIC_API_URL) ||
  (isProd ? 'https://clinic-queue-management-1-m8e8.onrender.com' : 'http://localhost:8080');

// http(s)://host -> ws(s)://host/ws unless NEXT_PUBLIC_WS_URL is set explicitly
export const WS_URL = clean(process.env.NEXT_PUBLIC_WS_URL) || `${API_URL.replace(/^http/i, 'ws')}/ws`;

export const DISPLAY_URL =
  clean(process.env.NEXT_PUBLIC_DISPLAY_URL) ||
  (isProd ? 'https://clinic-queue-management-ns69.vercel.app' : 'http://localhost:3001');

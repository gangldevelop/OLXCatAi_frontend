// Normalize APP_ORIGIN: prefer explicit env, else use current origin at runtime
// Falls back to localhost only when neither env nor window are available (e.g., SSR/build tools)
const RAW_APP_ORIGIN = (
  process.env.REACT_APP_APP_ORIGIN ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3001')
).trim();
export const APP_ORIGIN = RAW_APP_ORIGIN.replace(/\/$/, '');

// API base URL: must point at backend (e.g. http://localhost:3000/api). Never use frontend origin (3001) for API.
// In development, use relative path '/api' to leverage CRA proxy (avoids mixed content HTTPS->HTTP issues)
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? '/api' : `${APP_ORIGIN}/api`);

// Backend origin (without `/api`), used when we need to hit non-API auth endpoints directly.
// In development, use explicit backend URL even if API_BASE_URL is relative (for proxy)
export const BACKEND_ORIGIN = 
  process.env.REACT_APP_BACKEND_ORIGIN ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : API_BASE_URL.replace(/\/api\/?$/, ''));

export const AI_ENABLE = 'true'

export const WEBHOOK_CLIENT_STATE = process.env.REACT_APP_WEBHOOK_CLIENT_STATE || 'olxcat-ai-webhook-secret';

// Organization Id used for admin preset creation
export const ORGANIZATION_ID = process.env.REACT_APP_ORGANIZATION_ID || '93317fce-e17a-4db0-a445-deea729eaae9'


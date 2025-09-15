// Normalize APP_ORIGIN: prefer explicit env, else use current origin at runtime
// Falls back to localhost only when neither env nor window are available (e.g., SSR/build tools)
const RAW_APP_ORIGIN = (
  process.env.REACT_APP_APP_ORIGIN ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
).trim();
export const APP_ORIGIN = RAW_APP_ORIGIN.replace(/\/$/, '');

// API base URL: prefer explicit env. In dev, default to "/api" (CRA proxy).
// In production or Outlook WebView, default to same-origin "/api" to avoid mixed origins.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? '/api' : `${APP_ORIGIN}/api`);

export const AI_ENABLE = 'true'

export const WEBHOOK_CLIENT_STATE = process.env.REACT_APP_WEBHOOK_CLIENT_STATE || 'olxcat-ai-webhook-secret';

// Organization Id used for admin preset creation
export const ORGANIZATION_ID = process.env.REACT_APP_ORGANIZATION_ID || '93317fce-e17a-4db0-a445-deea729eaae9'


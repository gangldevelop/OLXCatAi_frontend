export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? '/api' : 'http://localhost:3000/api');

// Normalize APP_ORIGIN: prefer explicit env, else use current origin at runtime
// Falls back to localhost only when neither env nor window are available (e.g., SSR/build tools)
const RAW_APP_ORIGIN = (
  process.env.REACT_APP_APP_ORIGIN ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
).trim();
export const APP_ORIGIN = RAW_APP_ORIGIN.replace(/\/$/, '');

export const AI_ENABLE = 'true'

export const WEBHOOK_CLIENT_STATE = process.env.REACT_APP_WEBHOOK_CLIENT_STATE || 'olxcat-ai-webhook-secret';


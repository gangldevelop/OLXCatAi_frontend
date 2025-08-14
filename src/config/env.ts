export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? '/api' : 'http://localhost:3000/api');

export const APP_ORIGIN = process.env.REACT_APP_APP_ORIGIN || 'http://localhost:3000';

export const AI_ENABLE = (process.env.REACT_APP_AI_ENABLE || 'false').toLowerCase() === 'true';


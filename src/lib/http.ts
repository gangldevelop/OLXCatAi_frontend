import axios from 'axios'
import { API_BASE_URL } from '../config/env'
import { AuthStore } from '../stores/auth'
import { notifyError } from './notify'
import { ensureFreshGraphToken } from './outlookAuth'

export const http = axios.create({
  baseURL: API_BASE_URL,
  // Browser dev: we use header-based auth (JWT + x-graph-token), not cookies.
  // Setting this to true forces stricter CORS requirements (Allow-Credentials + non-* origin).
  withCredentials: false,
})

http.interceptors.request.use(config => {
  const { jwt, graphToken } = AuthStore.getState()
  const headers = config.headers as any
  const omitGraph = (config as any)?.omitGraphToken === true
  if (process.env.NODE_ENV === 'development') {
    const url = typeof config.url === 'string' ? config.url : ''
    if (url.startsWith('/emails')) {
      // eslint-disable-next-line no-console
      console.log('[HTTP] /emails request', {
        method: config.method,
        baseURL: config.baseURL,
        url,
        hasJwt: !!jwt,
        jwtLen: jwt ? jwt.length : 0,
        omitGraph,
        hasGraphToken: !!graphToken,
        graphLen: graphToken ? graphToken.length : 0,
      })
    }
  }
  // Track whether this request was sent with auth headers to avoid races where
  // a pre-login request 401 arrives after login and clears fresh tokens.
  ;(config as any).__hadJwtAtSend = !!jwt
  ;(config as any).__hadGraphAtSend = !omitGraph && !!graphToken
  
  // Add ngrok bypass header to skip ngrok free tier warning page
  // This is required when using ngrok free tier - it intercepts requests and shows HTML warning
  const ngrokSkipWarning = 'ngrok-skip-browser-warning'
  
  if (headers && typeof headers.set === 'function') {
    headers.set(ngrokSkipWarning, 'true')
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`)
    if (!omitGraph && graphToken) headers.set('x-graph-token', graphToken)
  } else {
    const h: Record<string, string> = { ...(headers || {}) }
    h[ngrokSkipWarning] = 'true'
    if (jwt) h['Authorization'] = `Bearer ${jwt}`
    if (!omitGraph && graphToken) h['x-graph-token'] = graphToken
    config.headers = h as any
  }
  return config
})

http.interceptors.response.use(
  r => r,
  async error => {
    const status = error?.response?.status
    const cfg = error?.config || {}
    const graphRequired = (cfg as any).graphRequired === true
    const isRetry = (cfg as any).__isRetry === true
    const hadJwtAtSend = (cfg as any).__hadJwtAtSend === true
    
    // Do not clear auth or redirect on 403; surface at page level
    if (status === 403) {
      return Promise.reject(error)
    }

    if (status === 401) {
      // Background change-feed polling should never log a user out.
      // It can 401 during startup/auth transitions and would otherwise wipe fresh tokens.
      if (cfg?.url === '/changes') {
        return Promise.reject(error)
      }

      // If the request was sent without a JWT, never clear current auth state.
      // This prevents pre-login 401s from wiping newly-acquired tokens.
      if (!hadJwtAtSend) {
        return Promise.reject(error)
      }
      const errorMessage = error?.response?.data?.error?.message || error?.message || ''
      const isTokenError = errorMessage.includes('JWT') || errorMessage.includes('token') || errorMessage.includes('InvalidAuthenticationToken') || errorMessage.includes('Access token required')

      const canRefreshInHost = typeof window !== 'undefined' &&
        !!window.OfficeRuntime?.auth?.getAccessToken &&
        !!window.Office?.context?.ui?.displayDialogAsync

      if (isTokenError && !isRetry) {
        if (!canRefreshInHost) {
          // Browser/dev: we cannot refresh Graph tokens via OfficeRuntime.
          // If backend is specifically complaining about the Graph token, don't clear auth (prevents logout loops).
          if (/microsoft graph token expired or invalid/i.test(errorMessage)) {
            notifyError('Microsoft Graph auth required', 'Your Graph token was rejected. Please sign in again to refresh it.')
            return Promise.reject(error)
          }
          console.warn('401 -> clearing auth', { url: cfg?.url, message: errorMessage })
          notifyError('Session expired', 'Please sign in again to continue.')
          AuthStore.clear()
          return Promise.reject(error)
        }
        try {
          const freshToken = await ensureFreshGraphToken()
          if (freshToken) {
            ;(cfg as any).__isRetry = true
            return http.request(cfg)
          }
        } catch {
          // Refresh failed (e.g. not in real Outlook host)
        }
        // In browser/dev we sometimes get a backend 401 specifically for Microsoft Graph token issues.
        // Don't immediately clear auth state here; keep tokens so the user can retry/login again
        // without getting stuck in a logout loop.
        if (/microsoft graph token expired or invalid/i.test(errorMessage)) {
          notifyError('Microsoft Graph auth required', 'Your Graph token was rejected. Please sign in again to refresh it.')
          return Promise.reject(error)
        }
        notifyError('Session expired', 'Please sign in again to continue.')
        console.warn('401 after refresh attempt -> clearing auth', { url: cfg?.url, message: errorMessage })
        AuthStore.clear()
        return Promise.reject(error)
      }
      
      if (graphRequired) {
        notifyError('Outlook authentication required', 'Please re-authenticate Outlook to continue.')
        return Promise.reject(error)
      }
      if (/microsoft graph token expired or invalid/i.test(errorMessage)) {
        notifyError('Microsoft Graph auth required', 'Your Graph token was rejected. Please sign in again to refresh it.')
        return Promise.reject(error)
      }
      notifyError('Session expired', 'Please sign in again')
      console.warn('401 -> clearing auth', { url: cfg?.url, message: errorMessage })
      AuthStore.clear()
      return Promise.reject(error)
    }
    
    if (status === 429) {
      notifyError('Rate limited', 'Too many requests. Please retry shortly.')
      return Promise.reject(error)
    }
    
    const data = error?.response?.data
    if (data?.error?.message) {
      error.message = data.error.message
    }
    return Promise.reject(error)
  }
)


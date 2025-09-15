import axios from 'axios'
import { API_BASE_URL } from '../config/env'
import { AuthStore } from '../stores/auth'
import { notifyError } from './notify'
import { ensureFreshGraphToken } from './outlookAuth'

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

http.interceptors.request.use(config => {
  const { jwt, graphToken } = AuthStore.getState()
  const headers = config.headers as any
  const omitGraph = (config as any)?.omitGraphToken === true
  if (headers && typeof headers.set === 'function') {
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`)
    if (!omitGraph && graphToken) headers.set('x-graph-token', graphToken)
  } else {
    const h: Record<string, string> = { ...(headers || {}) }
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
    
    // Do not clear auth or redirect on 403; surface at page level
    if (status === 403) {
      return Promise.reject(error)
    }

    if (status === 401) {
      // Check if this is a Graph token issue (JWT error suggests expired token)
      const errorMessage = error?.response?.data?.error?.message || error?.message || ''
      const isGraphTokenError = errorMessage.includes('JWT') || errorMessage.includes('token') || errorMessage.includes('InvalidAuthenticationToken')
      
      if (isGraphTokenError && !isRetry) {
        console.log('Graph token appears expired, attempting to refresh...')
        
        try {
          // Try to get a fresh Graph token
          const freshToken = await ensureFreshGraphToken()
          
          if (freshToken) {
            console.log('Successfully refreshed Graph token, retrying request...')
            
            // Mark this as a retry to avoid infinite loops
            ;(cfg as any).__isRetry = true
            
            // Retry the original request with the fresh token
            return http.request(cfg)
          } else {
            console.error('Failed to get fresh Graph token')
            notifyError('Outlook authentication required', 'Please re-authenticate Outlook to continue.')
            return Promise.reject(error)
          }
        } catch (refreshError) {
          console.error('Error refreshing Graph token:', refreshError)
          notifyError('Outlook authentication required', 'Please re-authenticate Outlook to continue.')
          return Promise.reject(error)
        }
      }
      
      if (graphRequired) {
        notifyError('Outlook authentication required', 'Please re-authenticate Outlook to continue.')
        return Promise.reject(error)
      }
      notifyError('Session expired', 'Please sign in again')
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


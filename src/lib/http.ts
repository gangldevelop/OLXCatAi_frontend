import axios from 'axios'
import { API_BASE_URL } from '../config/env'
import { AuthStore } from '../stores/auth'
import { notifyError } from './notify'

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
    if (status === 401 || status === 403) {
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


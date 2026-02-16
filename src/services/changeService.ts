import { http } from '../lib/http'
import { AuthStore } from '../stores/auth'

type ChangeItemEmailMoved = {
  type: 'email:moved'
  messageId: string
  destinationFolderId?: string
  categoryId?: string
  ts: number
}

type ChangeItemEmailBulkMoved = {
  type: 'email:bulk-moved'
  count: number
  categoryId?: string
  ts: number
}

export type ChangeItem = ChangeItemEmailMoved | ChangeItemEmailBulkMoved | { type: string; [key: string]: any }

type ChangesResponse = {
  success: boolean
  version: number
  items: ChangeItem[]
}

type Listener = (items: ChangeItem[]) => void

class ChangeService {
  private listeners: Set<Listener> = new Set()
  private running = false
  private aborted = false
  private currentVersion: number = -1
  private backoffMs: number = 0
  private visListener?: () => void
  private corsFailureCount = 0
  private corsDisabled = false

  constructor() {
    const saved = sessionStorage.getItem('changes_version')
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!Number.isNaN(parsed)) this.currentVersion = parsed
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    const unsubscribe = () => this.listeners.delete(listener)
    
    // Only start polling if we have auth tokens
    const { jwt } = AuthStore.getState()
    if (!this.running && jwt) {
      this.start()
    } else if (!jwt) {
      // If no auth, wait for auth and then start
      const checkAuth = () => {
        const { jwt: currentJwt } = AuthStore.getState()
        if (currentJwt && !this.running && this.listeners.size > 0) {
          this.start()
        }
      }
      // Check immediately
      checkAuth()
      // Subscribe to auth changes
      const unsubAuth = AuthStore.subscribe(() => {
        checkAuth()
      })
      // Clean up auth subscription when listener unsubscribes
      const originalUnsubscribe = unsubscribe
      return () => {
        originalUnsubscribe()
        unsubAuth()
      }
    }
    
    return unsubscribe
  }

  private emit(items: ChangeItem[]) {
    if (!items || items.length === 0) return
    this.listeners.forEach(l => {
      try { l(items) } catch {}
    })
  }

  private saveVersion(version: number) {
    this.currentVersion = version
    try { sessionStorage.setItem('changes_version', String(version)) } catch {}
  }

  private async pollOnce(timeoutMs: number): Promise<'again'> {
    // If CORS is disabled due to repeated failures, stop polling
    if (this.corsDisabled) {
      return 'again'
    }
    
    // Don't poll if we don't have auth tokens
    const { jwt } = AuthStore.getState()
    if (!jwt) {
      // Wait a bit and try again (auth might be in progress)
      await this.delay(2000)
      return 'again'
    }

    const headers: Record<string, string> = {}
    headers['If-None-Match'] = `"${this.currentVersion}"`

    try {
      const response = await http.get<ChangesResponse>(
        '/changes',
        {
          params: { timeoutMs },
          headers,
          omitGraphToken: true as any,
          // Accept 304/429 without throwing so we can manage backoff ourselves
          validateStatus: (s: number) => (s >= 200 && s < 300) || s === 304 || s === 429,
        } as any
      )
      
      // Reset CORS failure count on successful request
      this.corsFailureCount = 0

    if (response.status === 304) {
      this.backoffMs = 0
      return 'again'
    }

    if (response.status === 429) {
      // Respect Retry-After header when present
      const retryAfterHeader: string | undefined = (response.headers as any)['retry-after'] || (response.headers as any)['Retry-After']
      const computeRetryAfterMs = (): number | undefined => {
        if (!retryAfterHeader) return undefined
        const seconds = Number(retryAfterHeader)
        if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000)
        const date = new Date(retryAfterHeader)
        const ms = date.getTime() - Date.now()
        return Number.isFinite(ms) ? Math.max(0, ms) : undefined
      }
      const retryAfterMs = computeRetryAfterMs()
      if (typeof retryAfterMs === 'number') {
        await this.delay(retryAfterMs)
      } else {
        // Exponential backoff up to 15s with light jitter
        this.backoffMs = this.backoffMs ? Math.min(this.backoffMs * 2, 15000) : 1000
        const jitter = this.backoffMs * 0.2 * (Math.random() * 2 - 1)
        await this.delay(Math.max(0, Math.round(this.backoffMs + jitter)))
      }
      return 'again'
    }

    // 2xx
    this.backoffMs = 0
    const etagRaw = (response.headers?.etag as string) || (response.headers as any)?.ETag
    if (etagRaw) {
      const parsed = parseInt(String(etagRaw).replace(/"/g, ''), 10)
      if (!Number.isNaN(parsed)) this.saveVersion(parsed)
    }
    const body = response.data
    if (body && Array.isArray((body as any).items)) {
      this.emit((body as any).items as ChangeItem[])
    }
    return 'again'
    } catch (error: any) {
      // Handle CORS/preflight errors gracefully - backend needs to fix CORS config
      const isCorsError = error?.message?.includes('CORS') || 
                         error?.message?.includes('Access-Control') ||
                         error?.code === 'ERR_NETWORK' ||
                         (error?.response === undefined && error?.request !== undefined)
      
      if (isCorsError) {
        this.corsFailureCount++
        
        // After 3 consecutive CORS failures, disable polling and log a warning
        if (this.corsFailureCount >= 3 && !this.corsDisabled) {
          this.corsDisabled = true
          console.warn(
            '[ChangeService] CORS preflight failures detected. Disabling change polling. ' +
            'Backend must handle OPTIONS requests and return Access-Control-Allow-Origin header. ' +
            'Required origin: ' + window.location.origin
          )
          // Stop the loop
          this.running = false
          return 'again'
        }
        
        // Silently retry with exponential backoff - backend CORS needs to be fixed
        this.backoffMs = this.backoffMs ? Math.min(this.backoffMs * 2, 30000) : 5000
        await this.delay(this.backoffMs)
        return 'again'
      }
      
      // Reset CORS failure count on non-CORS errors
      this.corsFailureCount = 0
      
      // Re-throw other errors
      throw error
    }
  }

  private async loop() {
    if (this.running) return
    this.running = true
    this.aborted = false
    while (!this.aborted) {
      // If there are no listeners, stop
      if (this.listeners.size === 0) {
        break
      }
      // Pause polling in background to reduce server load
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        await this.delay(2000)
        continue
      }
      try {
        await this.pollOnce(25000)
      } catch (e) {
        // Network or unexpected error: small backoff then continue
        this.backoffMs = this.backoffMs ? Math.min(this.backoffMs * 2, 15000) : 1000
        await this.delay(this.backoffMs)
      }
    }
    this.running = false
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  start() {
    if (this.running) return
    this.loop()
    // watch visibility changes
    if (typeof document !== 'undefined' && !this.visListener) {
      this.visListener = () => {
        if (!this.running && this.listeners.size > 0 && document.visibilityState === 'visible') {
          this.loop()
        }
      }
      document.addEventListener('visibilitychange', this.visListener)
    }
  }

  stop() {
    this.aborted = true
    if (this.listeners.size === 0 && this.visListener) {
      document.removeEventListener('visibilitychange', this.visListener)
      this.visListener = undefined
    }
  }
}

export const changeService = new ChangeService()



import { http } from '../lib/http'

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
    if (!this.running) {
      this.start()
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
    const headers: Record<string, string> = {}
    headers['If-None-Match'] = `"${this.currentVersion}"`

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

    if (response.status === 304) {
      this.backoffMs = 0
      return 'again'
    }

    if (response.status === 429) {
      // Exponential backoff up to 15s
      this.backoffMs = this.backoffMs ? Math.min(this.backoffMs * 2, 15000) : 1000
      await this.delay(this.backoffMs)
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
  }

  private async loop() {
    if (this.running) return
    this.running = true
    this.aborted = false
    while (!this.aborted) {
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
  }

  stop() {
    this.aborted = true
  }
}

export const changeService = new ChangeService()



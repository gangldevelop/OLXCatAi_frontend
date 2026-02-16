import { http } from '../lib/http'
import { BackendEmailMessage } from '../types/email'
import { withBackoff } from '../lib/backoff'
import { BulkMoveRequest, BulkMoveResponse } from '../types/bulkMove'
import { ensureFreshGraphToken } from '../lib/outlookAuth'

// Simple in-memory ETag cache keyed by endpoint+params
type EmailListCacheEntry = { etag: string; data: BackendEmailMessage[] }
const emailEtagCache = new Map<string, EmailListCacheEntry>()

function buildListKey(top?: number, skip?: number) {
  return `emails:list?top=${top ?? ''}&skip=${skip ?? ''}`
}

function buildSearchKey(q: string, top?: number, skip?: number) {
  return `emails:search?q=${encodeURIComponent(q)}&top=${top ?? ''}&skip=${skip ?? ''}`
}

function extractEtag(headers: any): string | undefined {
  const raw = (headers?.etag as string) || (headers?.ETag as string)
  if (!raw) return undefined
  return String(raw)
}

export const emailService = {
  list: (top?: number, skip?: number, signal?: AbortSignal) =>
    withBackoff(async () => {
      const key = buildListKey(top, skip)
      const cached = emailEtagCache.get(key)
      const headers: Record<string, string> = {}
      if (cached?.etag) headers['If-None-Match'] = cached.etag
      const response = await http.get<{ success: boolean; data: BackendEmailMessage[] }>(
        '/emails',
        {
          params: { top, skip },
          headers,
          signal,
          validateStatus: (s: number) => (s >= 200 && s < 300) || s === 304,
        } as any
      )
      if (response.status === 304 && cached) return cached.data
      const data = response.data.data
      const etag = extractEtag(response.headers)
      if (etag) emailEtagCache.set(key, { etag, data })
      return data
    }, { retryOn429: true, retryOn503: true }),
  get: (id: string) => http.get<{ success: boolean; data: BackendEmailMessage }>(`/emails/${encodeURIComponent(id)}`).then(r => r.data.data),
  search: (q: string, top?: number, skip?: number, signal?: AbortSignal) =>
    withBackoff(async () => {
      const key = buildSearchKey(q, top, skip)
      const cached = emailEtagCache.get(key)
      const headers: Record<string, string> = {}
      if (cached?.etag) headers['If-None-Match'] = cached.etag
      const response = await http.get<{ success: boolean; data: BackendEmailMessage[] }>(
        `/emails/search/${encodeURIComponent(q)}`,
        {
          params: { top, skip },
          headers,
          signal,
          validateStatus: (s: number) => (s >= 200 && s < 300) || s === 304,
        } as any
      )
      if (response.status === 304 && cached) return cached.data
      const data = response.data.data
      const etag = extractEtag(response.headers)
      if (etag) emailEtagCache.set(key, { etag, data })
      return data
    }, { retryOn429: true, retryOn503: true }),
  categorize: (id: string, categories: string[]) =>
    http.post(`/emails/${encodeURIComponent(id)}/categorize`, { categories }).then(r => r.data),
  markRead: (id: string) => http.post(`/emails/${encodeURIComponent(id)}/read`).then(r => r.data),
  predictCategory: (id: string) =>
    http
      .post<{ success: boolean; data: { emailId: string; predictions: Array<{ categoryId: string; confidence: number }> } }>(
        `/emails/${encodeURIComponent(id)}/predict-category`
      )
      .then(r => r.data.data?.predictions || []),
  move: async (id: string, categoryId: string) => {
    await ensureFreshGraphToken()
    return http
      .post(`/emails/${encodeURIComponent(id)}/move`, { categoryId }, { graphRequired: true } as any)
      .then(r => r.data)
  },
  bulkMove: async (req: BulkMoveRequest) => {
    await ensureFreshGraphToken()
    return http
      .post<BulkMoveResponse>('/emails/bulk-move', req, { graphRequired: true } as any)
      .then(r => r.data)
  },
  feedback: async (id: string, categoryId: string, autoMove: boolean = true) => {
    await ensureFreshGraphToken()
    return http
      .post(
        `/emails/${encodeURIComponent(id)}/feedback`,
        { categoryId, autoMove },
        { graphRequired: true } as any
      )
      .then(r => r.data)
  },
}


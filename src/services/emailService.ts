import { http } from '../lib/http'
import { BackendEmailMessage } from '../types/email'
import { withBackoff } from '../lib/backoff'

export const emailService = {
  list: (top?: number, skip?: number) =>
    withBackoff(() =>
      http.get<{ success: boolean; data: BackendEmailMessage[] }>('/emails', { params: { top, skip } }).then(r => r.data.data)
    ),
  get: (id: string) => http.get<{ success: boolean; data: BackendEmailMessage }>(`/emails/${encodeURIComponent(id)}`).then(r => r.data.data),
  search: (q: string, top?: number, skip?: number) =>
    withBackoff(() =>
      http.get<{ success: boolean; data: BackendEmailMessage[] }>('/emails/search', { params: { q, top, skip } }).then(r => r.data.data)
    ),
  categorize: (id: string, categories: string[]) =>
    http.post(`/emails/${encodeURIComponent(id)}/categorize`, { categories }).then(r => r.data),
  markRead: (id: string) => http.post(`/emails/${encodeURIComponent(id)}/read`).then(r => r.data),
  predictCategory: (id: string) =>
    http
      .post<{ success: boolean; data: { emailId: string; predictions: Array<{ categoryId: string; confidence: number }> } }>(
        `/emails/${encodeURIComponent(id)}/predict-category`
      )
      .then(r => r.data.data?.predictions || []),
  move: (id: string, categoryId: string) =>
    http.post(`/emails/${encodeURIComponent(id)}/move`, { categoryId }).then(r => r.data),
  bulkMove: (messageIds: string[], categoryId: string, batchSize?: number, concurrency?: number) =>
    http.post('/emails/bulk-move', { messageIds, categoryId, batchSize, concurrency }).then(r => r.data),
  feedback: (id: string, categoryId: string, autoMove: boolean = true) =>
    http
      .post(
        `/emails/${encodeURIComponent(id)}/feedback`,
        { categoryId, autoMove },
        { graphRequired: true } as any
      )
      .then(r => r.data),
}


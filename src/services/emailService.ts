import { http } from '../lib/http'
import { BackendEmailMessage, CategoryPrediction } from '../types/email'

export const emailService = {
  list: (top?: number, skip?: number) =>
    http.get<{ success: boolean; data: BackendEmailMessage[] }>('/emails', { params: { top, skip } }).then(r => r.data.data),
  get: (id: string) => http.get<{ success: boolean; data: BackendEmailMessage }>(`/emails/${encodeURIComponent(id)}`).then(r => r.data.data),
  search: (q: string, top?: number, skip?: number) =>
    http.get<{ success: boolean; data: BackendEmailMessage[] }>('/emails/search', { params: { q, top, skip } }).then(r => r.data.data),
  categorize: (id: string, categories: string[]) =>
    http.post(`/emails/${encodeURIComponent(id)}/categorize`, { categories }).then(r => r.data),
  markRead: (id: string) => http.post(`/emails/${encodeURIComponent(id)}/read`).then(r => r.data),
  predictCategory: (id: string) =>
    http.post<CategoryPrediction>(`/emails/${encodeURIComponent(id)}/predict-category`).then(r => r.data),
  move: (id: string, categoryId: string) =>
    http.post(`/emails/${encodeURIComponent(id)}/move`, { categoryId }).then(r => r.data),
  bulkMove: (messageIds: string[], categoryId: string, batchSize?: number, concurrency?: number) =>
    http.post('/emails/bulk-move', { messageIds, categoryId, batchSize, concurrency }).then(r => r.data),
}


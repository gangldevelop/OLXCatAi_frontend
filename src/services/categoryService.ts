import { http } from '../lib/http'
import { BackendCategory } from '../types/category'

export const categoryService = {
  list: () => http
    .get<{ success: boolean; data: BackendCategory[] | BackendCategory }>(
      '/categories',
      { graphRequired: true } as any,
    )
    .then(r => (Array.isArray(r.data.data) ? r.data.data : [r.data.data])),
  defaults: () => http.get<{ success: boolean; data: BackendCategory[] }>('/categories/defaults').then(r => r.data.data),
  get: (id: string) => http.get<{ success: boolean; data: BackendCategory }>(`/categories/${id}`).then(r => r.data.data),
  create: (params: { name: string; color: string; keywords?: string[] | null; linkFolder?: boolean }) => {
    const { name, color, keywords, linkFolder } = params
    const keywordsPayload: string | string[] | null | undefined = Array.isArray(keywords)
      ? keywords.join(', ')
      : keywords ?? null
    return http
      .post<{ success: boolean; data: BackendCategory }>(
        '/categories',
        { name, color, keywords: keywordsPayload, linkFolder: !!linkFolder },
        { omitGraphToken: !linkFolder, graphRequired: !!linkFolder } as any,
      )
      .then(r => r.data.data)
  },
  update: (id: string, updates: Partial<{ name: string; color: string; keywords: string[] | null }>) => {
    const payload: any = { ...updates }
    if (Array.isArray(updates.keywords)) {
      payload.keywords = updates.keywords.join(', ')
    }
    return http
      .put<{ success: boolean; data: BackendCategory }>(`/categories/${id}`, payload)
      .then(r => r.data.data)
  },
  delete: (id: string, hard?: boolean) => http.delete(`/categories/${id}`, { params: { hard } }).then(r => r.data),
  predict: (content: string) => http.post('/categories/predict', { content }).then(r => r.data),
  syncFromOutlook: () =>
    http
      .post<{
        success: boolean;
        data: {
          totalFolders: number;
          totalCategories: number;
          processed: number;
          items: Array<{ id: string; name: string; folderId: string; created: boolean; updated: boolean }>;
        };
      }>(
        '/categories/sync-from-outlook',
        undefined,
        { graphRequired: true } as any,
      )
      .then(r => r.data),
}


import { http } from '../lib/http'
import type { ReportsSummary, TopCategory } from '../types'

export type CategoryUsageRow = {
  categoryId: string
  categoryName: string
  messageCount: number
}

export const reportsService = {
  categoryUsage: () => http.get<CategoryUsageRow[]>('/reports/category-usage').then(r => r.data),
  // Optional new JWT-only route. Uses omitGraphToken to avoid sending x-graph-token.
  categoryUsageServer: () =>
    http
      .get<{ success: boolean; data: Array<{ categoryId: string; name: string; count: number }> }>(
        '/reports/category-usage-server',
        { omitGraphToken: true }
      )
      .then(res => {
        const rows = res.data.data
        return (rows || []).map((row: { categoryId: string; name: string; count: number }): CategoryUsageRow => ({
          categoryId: row.categoryId,
          categoryName: row.name,
          messageCount: row.count,
        }))
      }),
  summary: (from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return http
      .get<{ success: boolean; data: ReportsSummary }>(`/v1/reports/summary?${params.toString()}`, {
        omitGraphToken: true,
      })
      .then(r => r.data.data)
  },
  topCategories: (from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return http
      .get<{ success: boolean; data: TopCategory[] }>(`/v1/reports/top-categories?${params.toString()}`, {
        omitGraphToken: true,
      })
      .then(r => r.data.data)
  },
}

export const adminReportsService = {
  summary: (from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return http
      .get<{ success: boolean; data: ReportsSummary }>(`/v1/admin/reports/summary?${params.toString()}`, {
        omitGraphToken: true,
      })
      .then(r => r.data.data)
  },
  topCategories: (teamId?: string) => {
    const params = new URLSearchParams()
    if (teamId) params.set('teamId', teamId)
    return http
      .get<{ success: boolean; data: Array<{ categoryId: string; name?: string | null; count: number }> }>(
        `/v1/admin/reports/top-categories?${params.toString()}`,
        { omitGraphToken: true },
      )
      .then(r => r.data.data)
  },
}


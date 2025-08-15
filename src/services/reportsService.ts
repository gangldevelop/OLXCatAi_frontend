import { http } from '../lib/http'

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
}


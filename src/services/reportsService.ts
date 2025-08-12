import { http } from '../lib/http'

export type CategoryUsageRow = {
  categoryId: string
  categoryName: string
  messageCount: number
}

export const reportsService = {
  categoryUsage: () => http.get<CategoryUsageRow[]>('/reports/category-usage').then(r => r.data),
}


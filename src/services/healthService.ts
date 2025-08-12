import { http } from '../lib/http'

export const healthService = {
  status: () => http.get('/health/status').then(r => r.data),
}


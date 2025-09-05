import { http } from '../lib/http'
import { AuthStore } from '../stores/auth'

export interface Subscription {
  id: string
  resource: string
  changeType: string
  expirationDateTime: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSubscriptionRequest {
  resource: string
  changeType: string
  expirationDateTime: string
  clientState?: string
}

export interface SubscriptionSchedulerStatus {
  enabled: boolean
  intervalMs: number
  lookaheadHours: number
  extendDays: number
  lastRunAt: string | null
  lastError: string | null
}

export const subscriptionService = {
  // Get user's email subscriptions
  list: () => http
    .get<{ success: boolean; data: Subscription[] }>(`/subscriptions`)
    .then(r => r.data.data),

  // Create email monitoring subscription
  create: (params: CreateSubscriptionRequest) => http
    .post<{ success: boolean; data: Subscription }>(`/subscriptions`, params, { graphRequired: true } as any)
    .then(r => r.data.data),

  // Delete subscription
  delete: (id: string) => http
    .delete<{ success: boolean }>(`/subscriptions/${id}`)
    .then(r => r.data),

  // Get subscription status (scheduler/health)
  getStatus: () => http
    .get<{ success: boolean; data: SubscriptionSchedulerStatus }>(`/subscriptions/status`)
    .then(r => r.data.data),

  // Rotate subscriptions (dev-only)
  rotate: () => http
    .post<{ success: boolean }>(`/subscriptions/rotate`, {}, { graphRequired: true } as any)
    .then(r => r.data),
}

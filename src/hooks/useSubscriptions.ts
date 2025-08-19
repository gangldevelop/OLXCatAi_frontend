import { useState, useEffect, useCallback } from 'react'
import { subscriptionService, Subscription, CreateSubscriptionRequest } from '../services/subscriptionService'
import { notifyError } from '../lib/notify'
import { WEBHOOK_CLIENT_STATE } from '../config/env'

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await subscriptionService.list()
      setSubscriptions(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscriptions')
      notifyError('Subscription Error', err.message || 'Failed to fetch subscriptions')
    } finally {
      setLoading(false)
    }
  }, [])

  const createSubscription = useCallback(async (params: CreateSubscriptionRequest) => {
    try {
      setError(null)
      const newSubscription = await subscriptionService.create(params)
      setSubscriptions(prev => [...prev, newSubscription])
      return newSubscription
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription')
      notifyError('Subscription Error', err.message || 'Failed to create subscription')
      throw err
    }
  }, [])

  const deleteSubscription = useCallback(async (id: string) => {
    try {
      setError(null)
      await subscriptionService.delete(id)
      setSubscriptions(prev => prev.filter(sub => sub.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete subscription')
      notifyError('Subscription Error', err.message || 'Failed to delete subscription')
      throw err
    }
  }, [])

  const startEmailMonitoring = useCallback(async () => {
    const expirationDate = new Date(Date.now() + 48 * 60 * 60 * 1000) // within ~3 days per Graph
    const params: CreateSubscriptionRequest & { clientState: string } = {
      resource: '/me/messages',
      changeType: 'created',
      expirationDateTime: expirationDate.toISOString(),
      clientState: WEBHOOK_CLIENT_STATE,
    }

    return createSubscription(params)
  }, [createSubscription])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    createSubscription,
    deleteSubscription,
    startEmailMonitoring,
  }
}

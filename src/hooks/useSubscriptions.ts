import { useState, useEffect, useCallback } from 'react'
import { subscriptionService, Subscription, CreateSubscriptionRequest } from '../services/subscriptionService'
import { notifyError, notifySuccess } from '../lib/notify'
import { WEBHOOK_CLIENT_STATE } from '../config/env'
import { ensureFreshGraphToken } from '../lib/outlookAuth'

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
      await ensureFreshGraphToken()
      const newSubscription = await subscriptionService.create(params)
      setSubscriptions(prev => [...prev, newSubscription])
      notifySuccess('Monitoring enabled', 'Your inbox will be monitored for new emails.')
      return newSubscription
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        try {
          await ensureFreshGraphToken()
          const retried = await subscriptionService.create(params)
          setSubscriptions(prev => [...prev, retried])
          notifySuccess('Monitoring enabled', 'Your inbox will be monitored for new emails.')
          return retried
        } catch (err2: any) {
          setError(err2.message || 'Failed to create subscription')
          notifyError('Subscription Error', err2.message || 'Failed to create subscription')
          throw err2
        }
      }
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

  const rotateSubscriptions = useCallback(async () => {
    try {
      setError(null)
      await ensureFreshGraphToken()
      await subscriptionService.rotate()
      notifySuccess('Subscriptions rotated', 'Dev: Updated to current webhook URL.')
      await fetchSubscriptions()
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        try {
          await ensureFreshGraphToken()
          await subscriptionService.rotate()
          notifySuccess('Subscriptions rotated', 'Dev: Updated to current webhook URL.')
          await fetchSubscriptions()
          return
        } catch (err2: any) {
          setError(err2.message || 'Failed to rotate subscriptions')
          notifyError('Subscription Error', err2.message || 'Failed to rotate subscriptions')
          throw err2
        }
      }
      setError(err.message || 'Failed to rotate subscriptions')
      notifyError('Subscription Error', err.message || 'Failed to rotate subscriptions')
      throw err
    }
  }, [fetchSubscriptions])

  const startEmailMonitoring = useCallback(async () => {
    // Use Inbox folder messages and ~1h expiry as per dev guidance
    const expirationDate = new Date(Date.now() + 60 * 60 * 1000)
    const params: CreateSubscriptionRequest & { clientState: string } = {
      resource: "/me/mailFolders('Inbox')/messages",
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
    rotateSubscriptions,
  }
}

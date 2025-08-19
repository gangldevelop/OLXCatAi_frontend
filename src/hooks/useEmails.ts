import { useState, useCallback, useEffect } from 'react';
import { Email } from '../types';
import { emailService } from '../services/emailService';
import { BackendEmailMessage } from '../types/email';
import { mapBackendEmailToEmail } from '../lib/mappers';

const mapToEmail = (m: BackendEmailMessage): Email => mapBackendEmailToEmail(m)

export const useEmails = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // live polling removed to avoid rate limiting; will rely on manual refresh or backend push

  const load = useCallback(async (top?: number, skip?: number) => {
    setLoading(true)
    setError(null)
    try {
      const list = await emailService.list(top, skip)
      setEmails(list.map(mapToEmail))
    } catch (e: any) {
      setError(e?.message || 'Failed to load emails')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // removed polling effect

  const addEmail = useCallback((email: Omit<Email, 'id'>) => {
    const newEmail: Email = { ...email, id: Date.now().toString() }
    setEmails(prev => [newEmail, ...prev])
  }, [])

  const updateEmail = useCallback((id: string, updates: Partial<Email>) => {
    setEmails(prev => prev.map(email => email.id === id ? { ...email, ...updates } : email))
  }, [])

  const deleteEmail = useCallback((id: string) => {
    setEmails(prev => prev.filter(email => email.id !== id))
  }, [])

  const markAsProcessed = useCallback(async (id: string) => {
    try {
      await emailService.markRead(id)
      setEmails(prev => prev.map(email => email.id === id ? { ...email, isProcessed: true } : email))
    } catch {}
  }, [])

  const assignCategory = useCallback(async (emailId: string, categoryId: string) => {
    try {
      await emailService.feedback(emailId, categoryId, true)
      setEmails(prev => prev.map(email => email.id === emailId ? { ...email, categoryId, isProcessed: true } : email))
    } catch {}
  }, [])

  const getUnprocessedEmails = useCallback(() => emails.filter(email => !email.isProcessed), [emails])
  const getProcessedEmails = useCallback(() => emails.filter(email => email.isProcessed), [emails])

  return {
    emails,
    loading,
    error,
    load,
    addEmail,
    updateEmail,
    deleteEmail,
    markAsProcessed,
    assignCategory,
    getUnprocessedEmails,
    getProcessedEmails,
  };
};
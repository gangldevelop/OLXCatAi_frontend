import { useState, useCallback, useEffect } from 'react';
import { Category } from '../types';
import { categoryService } from '../services/categoryService';
import { BackendCategory } from '../types/category';
import { mapBackendCategoryToCategory } from '../lib/mappers'
import { notifyError, notifySuccess } from '../lib/notify'
import { AuthStore } from '../stores/auth'

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeColor = useCallback((c: string) => {
    const m = /^#([0-9a-fA-F]{3})$/.exec(c)
    if (m) {
      const [r, g, b] = m[1].split('')
      return `#${r}${r}${g}${g}${b}${b}`
    }
    return c
  }, [])

  const mapToUi = useCallback((b: BackendCategory): Category => {
    const mapped = mapBackendCategoryToCategory(b)
    return { ...mapped, color: normalizeColor(mapped.color) }
  }, [normalizeColor])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await categoryService.list()
      const mapped = list.map(mapToUi)
      setCategories(mapped)
    } catch (e: any) {
      setError(e?.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [mapToUi])

  useEffect(() => {
    load()
  }, [load])

  const addCategory = useCallback(async (category: { name: string; color: string; keywords?: string[]; linkFolder?: boolean }) => {
    try {
      const wantsLink = !!category.linkFolder
      if (wantsLink && !AuthStore.getState().graphToken) {
        notifyError('Outlook authentication required', 'Please re-authenticate Outlook to create and link a folder.')
        throw new Error('Graph token missing')
      }
      const created = await categoryService.create({
        name: category.name,
        color: normalizeColor(category.color),
        keywords: Array.isArray(category.keywords) ? category.keywords : [],
        linkFolder: wantsLink,
      })
      setCategories(prev => [...prev, mapToUi(created)])
      notifySuccess(wantsLink ? 'Category created and linked' : 'Label-only category created')
    } catch (e: any) {
      if (e?.message?.includes('exists') || e?.response?.status === 409) {
        notifyError('A category with this name already exists.')
      } else if (e?.response?.status === 400) {
        notifyError('Invalid request', 'Name and color are required')
      } else if (e?.response?.status === 401) {
        notifyError('Outlook authentication required', 'Please re-authenticate Outlook to continue.')
      } else {
        notifyError('Failed to create category')
      }
      throw e
    }
  }, [mapToUi, normalizeColor])

  const importFromOutlook = useCallback(async () => {
    try {
      if (!AuthStore.getState().graphToken) {
        notifyError('Outlook authentication required', 'Please re-authenticate Outlook to import folders.')
        throw new Error('Graph token missing')
      }
      const res = await categoryService.syncFromOutlook()
      await load()
      const processed = (res?.data as any)?.processed ?? 0
      notifySuccess('Import completed', `${processed} folders processed`)
      return res
    } catch (e: any) {
      if (e?.response?.status === 401) {
        notifyError('Outlook authentication required', 'Please re-authenticate Outlook to import folders.')
      } else {
        notifyError('Failed to import from Outlook')
      }
      throw e
    }
  }, [load])

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const updated = await categoryService.update(id, {
      name: updates.name,
      color: updates.color ? normalizeColor(updates.color) : undefined,
      keywords: Array.isArray(updates.keywords) ? updates.keywords : [],
    })
    const merged = {
      ...updated,
      keywords: (updated as any).keywords ?? updates.keywords ?? [],
    } as BackendCategory
    setCategories(prev => prev.map(cat => cat.id === id ? mapToUi(merged) : cat))
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    await categoryService.delete(id, false)
    setCategories(prev => prev.filter(cat => cat.id !== id))
  }, [])

  const toggleCategoryActive = useCallback((id: string) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, isActive: !cat.isActive } : cat))
  }, [])

  return {
    categories,
    loading,
    error,
    load,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    importFromOutlook,
  };
};
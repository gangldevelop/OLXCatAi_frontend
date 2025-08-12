import { Category, Email } from '../types'
import { BackendCategory } from '../types/category'
import { BackendEmailMessage } from '../types/email'

export const normalizeHexColor = (color: string): string => {
  const short = /^#([0-9a-fA-F]{3})$/.exec(color)
  if (short) {
    const [r, g, b] = short[1].split('')
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return color
}

export const mapBackendCategoryToCategory = (backend: BackendCategory): Category => ({
  id: backend.id,
  name: backend.name,
  color: normalizeHexColor(backend.color),
  outlookFolderId: backend.outlookFolderId,
  keywords: Array.isArray(backend.keywords)
    ? backend.keywords
    : typeof backend.keywords === 'string'
      ? backend.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : [],
  isActive: !backend.isDeleted,
})

export const mapBackendEmailToEmail = (backend: BackendEmailMessage): Email => ({
  id: backend.id,
  subject: backend.subject,
  sender: backend.from?.emailAddress?.name || backend.from?.emailAddress?.address || '',
  body: backend.body?.content || '',
  receivedDate: new Date(backend.receivedDateTime),
  categoryId: Array.isArray(backend.categories) && backend.categories.length > 0 ? backend.categories[0] : undefined,
  isProcessed: !!backend.isRead,
})



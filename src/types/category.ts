export type BackendCategory = {
  id: string
  userId: string
  name: string
  color: string
  outlookFolderId: string | null
  isDefault: boolean
  isDeleted: boolean
  keywords?: string[] | string | null
  createdAt: string
  updatedAt: string
}


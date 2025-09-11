export type OrgCategoryPreset = {
  id: string
  organizationId: string
  teamId?: string | null
  name: string
  color?: string | null
  keywords?: string | null
  isDefault: boolean
  locked: boolean
  createdAt?: string
  updatedAt?: string
}



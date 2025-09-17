import { http } from '../lib/http'

export type CreatePresetRequest = {
  organizationId?: string
  teamId?: string
  name: string
  color?: string
  keywords?: string | null
  isDefault?: boolean
  locked?: boolean
}

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

export type AdminMembership = {
  organizationId: string
  organizationName: string
  teamId?: string | null
  teamName?: string | null
  role: string
}

export type DistributeOptions = {
  createMissingFolders: boolean
  overwriteNames?: boolean
}

export type DistributeRequest = {
  organizationId: string
  teamId?: string
  userIds?: string[]
  options: DistributeOptions
}

export type DistributeUserResult = {
  userId: string
  created: number
  updated: number
  skipped: number
  folderLinked: number
}

export type DistributeResponse = {
  success: true
  data: {
    count: number
    results: DistributeUserResult[]
  }
}

export const adminService = {
  listPresets: (query?: { organizationId?: string; teamId?: string }) =>
    http
      .get<{ success: true; data: OrgCategoryPreset[]; count: number }>(
        '/v1/admin/presets',
        { params: query, omitGraphToken: true } as any,
      )
      .then(r => r.data),

  getPreset: (id: string) =>
    http
      .get<{ success: true; data: OrgCategoryPreset }>(`/v1/admin/presets/${id}`, { omitGraphToken: true } as any)
      .then(r => r.data.data),

  createPreset: (req: CreatePresetRequest) =>
    http.post('/v1/admin/presets', req, { omitGraphToken: true } as any).then(r => r.data),

  updatePreset: (id: string, updates: Partial<CreatePresetRequest>) =>
    http.put(`/v1/admin/presets/${id}`, updates, { omitGraphToken: true } as any).then(r => r.data),

  deletePreset: (id: string) =>
    http
      .delete<{ success: true; message: string }>(`/v1/admin/presets/${id}`, { omitGraphToken: true } as any)
      .then(r => r.data),

  // Harmless permission probe: if 403 → no access; 400/2xx → assume access
  probeAccess: async (): Promise<boolean> => {
    try {
      await http.post('/v1/admin/presets', {}, { omitGraphToken: true } as any)
      return true
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 403) return false
      return true
    }
  },

  getAdminContext: () =>
    http
      .get<{ success: true; data: { memberships: AdminMembership[] } }>(
        '/v1/admin/debug/context',
        { omitGraphToken: true } as any,
      )
      .then(r => r.data.data.memberships),

  distributePresets: (req: DistributeRequest) =>
    http
      .post<DistributeResponse>('/v1/admin/presets/distribute', req, { omitGraphToken: true } as any)
      .then(r => r.data),
}



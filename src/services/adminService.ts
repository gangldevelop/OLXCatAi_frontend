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
}



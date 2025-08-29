import { http } from '../lib/http'

export type CreatePresetRequest = {
  organizationId: string
  name: string
  color: string
  keywords?: string | null
  isDefault: boolean
  locked: boolean
}

export const adminService = {
  createPreset: (req: CreatePresetRequest) =>
    http.post('/v1/admin/presets', req, { omitGraphToken: true } as any).then(r => r.data),

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



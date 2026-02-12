import React, { useEffect, useMemo, useState } from 'react'
import { adminService } from '../services/adminService'
import { ORGANIZATION_ID } from '../config/env'
import { notifyError, notifySuccess } from '../lib/notify'
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogActions,
  Input,
  Label,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Spinner,
  Switch,
  Textarea,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { DeleteRegular, ShieldRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  card: {
    padding: '20px 24px',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '14px',
    borderBottom: '1px solid #f1f5f9',
  },
  cardHeaderIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#f0f7ff',
    color: '#0f6cbd',
    flexShrink: 0,
  },
  cardHeaderText: {
    fontSize: '15px',
    fontWeight: '600' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  grid: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  controlsBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
    flexWrap: 'wrap',
  },
  responsiveTable: { width: '100%' },
  truncatedCell: {
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    verticalAlign: 'bottom',
    fontSize: '13px',
    color: '#1e293b',
  },
  actionsCell: { textAlign: 'right' },
  primaryButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
    background: 'linear-gradient(135deg, #0f6cbd 0%, #2563eb 100%) !important',
    border: 'none !important',
    boxShadow: '0 2px 8px rgba(15, 108, 189, 0.3)',
  },
  secondaryButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
  },
})

type Membership = {
  organizationId: string
  organizationName: string
  teamId?: string | null
  teamName?: string | null
  role: string
}

type PresetForm = {
  name: string
  color: string
  keywords: string
  isDefault: boolean
  locked: boolean
}

type DistributeOptions = {
  createMissingFolders: boolean
  overwriteNames: boolean
}

export const AdminPresets: React.FC<{ organizationId?: string; teamId?: string }> = ({ organizationId, teamId }) => {
  const styles = useStyles()
  const [loading, setLoading] = useState<boolean>(false)
  const [presets, setPresets] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [debounced, setDebounced] = useState('')
  const [top, setTop] = useState(10)
  const [skip, setSkip] = useState(0)
  const [count, setCount] = useState<number>(0)
  const [forbidden, setForbidden] = useState<boolean>(false)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(organizationId || ORGANIZATION_ID)
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(teamId)

  // Create/Edit modal
  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PresetForm>({ name: '', color: '#2b88d8', keywords: '', isDefault: false, locked: false })
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)
  const [formErrors, setFormErrors] = useState<{ name?: string; color?: string; keywords?: string }>({})

  // Distribute dialog
  const [distributeOpen, setDistributeOpen] = useState<boolean>(false)
  const [distOptions, setDistOptions] = useState<DistributeOptions>({ createMissingFolders: true, overwriteNames: false })
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState<boolean>(false)
  const [distributing, setDistributing] = useState<boolean>(false)
  const [results, setResults] = useState<{ count: number; results: Array<{ userId: string; created: number; updated: number; skipped: number; folderLinked: number }> } | null>(null)

  const scopeLabel = useMemo(() => {
    const match = memberships.find(mem => mem.organizationId === (selectedOrgId || ORGANIZATION_ID) && (mem.teamId || undefined) === (selectedTeamId || undefined))
    if (match) return `${match.organizationName}${match.teamName ? ` / ${match.teamName}` : ''}`
    return selectedTeamId ? `${selectedOrgId} / ${selectedTeamId}` : `${selectedOrgId}`
  }, [memberships, selectedOrgId, selectedTeamId])

  const fetchPresets = async () => {
    setLoading(true)
    try {
      const q = {
        organizationId: selectedOrgId || ORGANIZATION_ID,
        teamId: selectedTeamId,
      }
      const res = await adminService.listPresets(q)
      setPresets(res.data || [])
      setCount(res.count || (res.data?.length ?? 0))
      setForbidden(false)
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 403) {
        notifyError("You don't have admin permissions for this organization.")
        setForbidden(true)
      } else {
        notifyError('Failed to load presets')
      }
    } finally {
      setLoading(false)
    }
  }

  // Load admin context once
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const ctx = await adminService.getAdminContext().catch(() => [])
        if (mounted && Array.isArray(ctx)) {
          setMemberships(ctx as any)
          if (!organizationId && ctx.length > 0) {
            setSelectedOrgId(prev => prev || ctx[0].organizationId)
            setSelectedTeamId(prev => prev ?? (ctx[0].teamId || undefined))
          }
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  // Fetch presets when scope changes
  useEffect(() => {
    ;(async () => { await fetchPresets() })()
  }, [selectedOrgId, selectedTeamId])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(filter), 250)
    return () => clearTimeout(t)
  }, [filter])

  const filtered = useMemo(() => {
    const start = skip
    const end = skip + top
    const data = debounced
      ? presets.filter(p => p.name.toLowerCase().includes(debounced.toLowerCase()))
      : presets
    return { total: data.length, page: data.slice(start, end) }
  }, [presets, debounced, skip, top])

  const handleDelete = async (id: string) => {
    try {
      await adminService.deletePreset(id)
      notifySuccess('Preset deleted')
      await fetchPresets()
    } catch (e: any) {
      notifyError('Failed to delete preset')
    }
  }

  // Create/Edit Preset
  const validateForm = (f: PresetForm) => {
    const errs: { name?: string; color?: string; keywords?: string } = {}
    if (!f.name || f.name.trim().length < 1 || f.name.trim().length > 60) errs.name = 'Name 1–60 chars'
    if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(f.color || '')) errs.color = 'Invalid hex color'
    if (f.keywords && f.keywords.length > 1000) errs.keywords = 'Max 1000 characters'
    return errs
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', color: '#2b88d8', keywords: '', isDefault: false, locked: false })
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      name: p.name || '',
      color: p.color || '#2b88d8',
      keywords: p.keywords || '',
      isDefault: !!p.isDefault,
      locked: !!p.locked,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const submitForm = async () => {
    const errs = validateForm(form)
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    setFormSubmitting(true)
    try {
      if (editingId) {
        const body: any = {
          name: form.name,
          color: form.color,
          keywords: form.keywords || null,
          isDefault: form.isDefault,
          locked: form.locked,
        }
        await adminService.updatePreset(editingId, body)
        notifySuccess('Preset updated')
      } else {
        const body: any = {
          organizationId: selectedOrgId || ORGANIZATION_ID,
          teamId: selectedTeamId,
          name: form.name,
          color: form.color,
          keywords: form.keywords || null,
          isDefault: form.isDefault,
          locked: form.locked,
        }
        await adminService.createPreset(body)
        notifySuccess('Preset created')
      }
      setFormOpen(false)
      await fetchPresets()
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 409) {
        notifyError('A preset with this name already exists')
      } else if (status === 403) {
        notifyError("You don't have admin permissions for this organization.")
      } else {
        notifyError('Failed to save preset')
      }
    } finally {
      setFormSubmitting(false)
    }
  }

  // Distribute Presets
  const submitDistribute = async () => {
    if (distOptions.overwriteNames) {
      setConfirmOverwriteOpen(true)
      return
    }
    await actuallyDistribute()
  }

  const actuallyDistribute = async () => {
    setDistributing(true)
    setResults(null)
    try {
      const body: any = {
        organizationId: selectedOrgId || ORGANIZATION_ID,
        teamId: selectedTeamId,
        options: { createMissingFolders: distOptions.createMissingFolders, overwriteNames: distOptions.overwriteNames },
      }
      const res = await adminService.distributePresets(body)
      setResults(res.data)
      notifySuccess('Presets applied')
    } catch (e: any) {
      notifyError('Failed to distribute presets')
    } finally {
      setDistributing(false)
      setConfirmOverwriteOpen(false)
    }
  }

  return (
    <>
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderIcon}>
          <ShieldRegular />
        </div>
        <Text className={styles.cardHeaderText}>Admin Presets</Text>
      </div>
        <div className={styles.grid}>
          <div className={styles.controlsBar}>
            <Input value={filter} onChange={(_, d) => setFilter(d.value)} placeholder="Search presets" style={{ flex: 1, minWidth: 140 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Menu>
                <MenuTrigger>
                  <MenuButton size="small" appearance="secondary" className={styles.secondaryButton}>Scope: {scopeLabel}</MenuButton>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    {memberships.length === 0 && (
                      <MenuItem disabled>No admin context found</MenuItem>
                    )}
                    {memberships.map((m, i) => (
                      <MenuItem key={`${m.organizationId}-${m.teamId || 'org'}-${i}`} onClick={() => { setSelectedOrgId(m.organizationId); setSelectedTeamId(m.teamId || undefined); setSkip(0) }}>
                        {m.organizationName}{m.teamName ? ` / ${m.teamName}` : ''}
                      </MenuItem>
                    ))}
                  </MenuList>
                </MenuPopover>
              </Menu>
              <Button size="small" appearance="primary" className={styles.primaryButton} onClick={openCreate}>Create Preset</Button>
              <Button size="small" appearance="secondary" className={styles.secondaryButton} onClick={() => { setDistributeOpen(true); setResults(null) }}>Apply to Users</Button>
              <Text size={100}>Pg {Math.floor(skip / top) + 1}</Text>
              <Menu>
                <MenuTrigger>
                  <MenuButton size="small" appearance="secondary" className={styles.secondaryButton}>Actions</MenuButton>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem disabled>Page {Math.floor(skip / top) + 1} of {Math.max(1, Math.ceil(filtered.total / top))}</MenuItem>
                    <MenuItem disabled>Total: {count}</MenuItem>
                    <MenuItem onClick={() => setSkip(s => Math.max(0, s - top))} disabled={skip === 0}>Previous Page</MenuItem>
                    <MenuItem onClick={() => setSkip(s => s + top)} disabled={skip + top >= filtered.total}>Next Page</MenuItem>
                    <MenuDivider />
                    <MenuItem onClick={() => { setTop(10); setSkip(0); }}>10 / page</MenuItem>
                    <MenuItem onClick={() => { setTop(20); setSkip(0); }}>20 / page</MenuItem>
                    <MenuItem onClick={() => { setTop(50); setSkip(0); }}>50 / page</MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 16 }}><Spinner /></div>
          ) : forbidden ? (
            <div style={{ padding: 12 }}>
              <Text>You don't have admin permissions for this organization.</Text>
            </div>
          ) : (
            <Table className={styles.responsiveTable}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Locked</TableHeaderCell>
                  <TableHeaderCell>Default</TableHeaderCell>
                  <TableHeaderCell>Keywords</TableHeaderCell>
                  <TableHeaderCell className={styles.actionsCell}>Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.page.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className={styles.truncatedCell} title={p.name}>{p.name}</span>
                    </TableCell>
                    <TableCell>{p.locked ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{p.isDefault ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <span className={styles.truncatedCell} title={p.keywords || ''}>{p.keywords || '—'}</span>
                    </TableCell>
                    <TableCell className={styles.actionsCell}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <Button appearance="subtle" size="small" onClick={() => openEdit(p)} aria-label="Edit preset">Edit</Button>
                        <Button appearance="subtle" size="small" icon={<DeleteRegular />} onClick={() => handleDelete(p.id)} aria-label="Delete preset" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

    {/* Create/Edit Preset Modal */}
    <Dialog open={formOpen} onOpenChange={(_, d) => setFormOpen(d.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{editingId ? 'Edit Preset' : 'Create Preset'}</DialogTitle>
          <DialogContent>
            <div className={styles.grid}>
              <div>
                <Label required>Name</Label>
                <Input value={form.name} onChange={(_, d) => setForm(f => ({ ...f, name: d.value }))} />
                {formErrors.name && <Text size={200} style={{ color: tokens.colorPaletteRedForeground3 }}>{formErrors.name}</Text>}
              </div>
              <div>
                <Label required>Color</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 40, height: 28, border: 'none', background: 'transparent' }} />
                  <Input value={form.color} onChange={(_, d) => setForm(f => ({ ...f, color: d.value }))} style={{ width: 120 }} />
                </div>
                {formErrors.color && <Text size={200} style={{ color: tokens.colorPaletteRedForeground3 }}>{formErrors.color}</Text>}
              </div>
              <div>
                <Label>Keywords (comma-separated)</Label>
                <Textarea value={form.keywords} onChange={(_, d) => setForm(f => ({ ...f, keywords: d.value }))} resize="vertical" />
                {formErrors.keywords && <Text size={200} style={{ color: tokens.colorPaletteRedForeground3 }}>{formErrors.keywords}</Text>}
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Switch checked={form.isDefault} onChange={(_, d) => setForm(f => ({ ...f, isDefault: d.checked }))} label="Default" />
                <Switch checked={form.locked} onChange={(_, d) => setForm(f => ({ ...f, locked: d.checked }))} label="Locked" />
              </div>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Org: {selectedOrgId}{selectedTeamId ? ` • Team: ${selectedTeamId}` : ''}</Text>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button appearance="primary" onClick={submitForm} disabled={formSubmitting}>{editingId ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>

    {/* Distribute Presets Dialog */}
    <Dialog open={distributeOpen} onOpenChange={(_, d) => setDistributeOpen(d.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Apply presets to users</DialogTitle>
          <DialogContent>
            <div className={styles.grid}>
              <Text>Scope: <b>{scopeLabel}</b></Text>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Switch checked={!!selectedTeamId} onChange={(_, d) => { setSelectedTeamId(d.checked ? (memberships.find(m => m.organizationId === (selectedOrgId || ORGANIZATION_ID) && m.teamId)?.teamId || undefined) : undefined) }} label="Limit to Team (uses selected team)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Switch checked={distOptions.createMissingFolders} onChange={(_, d) => setDistOptions(o => ({ ...o, createMissingFolders: d.checked }))} label="Ensure Outlook folder exists and link it" />
                <Switch checked={distOptions.overwriteNames} onChange={(_, d) => setDistOptions(o => ({ ...o, overwriteNames: d.checked }))} label="Rename user categories to match preset names (WARNING)" />
                {results !== null && results.results && (
                  <div style={{ marginTop: 8 }}>
                    <Text weight="semibold">Results</Text>
                    <Table className={styles.responsiveTable}>
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>User</TableHeaderCell>
                          <TableHeaderCell>Created</TableHeaderCell>
                          <TableHeaderCell>Updated</TableHeaderCell>
                          <TableHeaderCell>Skipped</TableHeaderCell>
                          <TableHeaderCell>Folder Linked</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.results.map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{r.userId}</TableCell>
                            <TableCell>{r.created}</TableCell>
                            <TableCell>{r.updated}</TableCell>
                            <TableCell>{r.skipped}</TableCell>
                            <TableCell>{r.folderLinked}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {results && results.results && results.results.filter(r => r.folderLinked === 0).length > 0 && (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Hint: Ask users to log in first so we can link Outlook folders.</Text>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setDistributeOpen(false)}>Close</Button>
            <Button appearance="primary" onClick={submitDistribute} disabled={distributing}>Apply</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>

    {/* Confirm overwrite names */}
    <Dialog open={confirmOverwriteOpen} onOpenChange={(_, d) => setConfirmOverwriteOpen(d.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Confirm overwrite category names</DialogTitle>
          <DialogContent>
            <Text>Overwrite will rename user categories to match preset names. This may change user-visible labels. Proceed?</Text>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setConfirmOverwriteOpen(false)}>Cancel</Button>
            <Button appearance="primary" onClick={actuallyDistribute} disabled={distributing}>Yes, proceed</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
    </>
  )
}

export default AdminPresets



import React, { useEffect, useMemo, useState } from 'react'
import { adminService } from '../services/adminService'
import { http } from '../lib/http'
import { ORGANIZATION_ID } from '../config/env'
import { notifyError, notifySuccess } from '../lib/notify'
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
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
  grid: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  controlsBar: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', marginBottom: tokens.spacingVerticalS },
  responsiveTable: { width: '100%' },
  truncatedCell: {
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    verticalAlign: 'bottom',
  },
  actionsCell: { textAlign: 'right' },
})

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

  const fetchPresets = async () => {
    setLoading(true)
    try {
      const q = {
        organizationId: organizationId || ORGANIZATION_ID,
        teamId,
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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await fetchPresets()
    })()
    return () => {
      mounted = false
    }
  }, [organizationId, teamId])

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

  return (
    <Card>
      <CardHeader image={<ShieldRegular />} header={<Text weight="semibold">Admin Presets</Text>} />
      <CardPreview>
        <div className={styles.grid}>
          <div className={styles.controlsBar}>
            <Input value={filter} onChange={(_, d) => setFilter(d.value)} placeholder="Search presets" style={{ flex: 1, minWidth: 140 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text size={100}>Pg {Math.floor(skip / top) + 1}</Text>
              <Menu>
                <MenuTrigger>
                  <MenuButton size="small" appearance="secondary">Actions</MenuButton>
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
                      <Button appearance="subtle" size="small" icon={<DeleteRegular />} onClick={() => handleDelete(p.id)} aria-label="Delete preset" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardPreview>
    </Card>
  )
}

export default AdminPresets



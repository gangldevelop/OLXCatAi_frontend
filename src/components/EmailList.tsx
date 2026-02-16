import React, { useEffect, useRef, useState } from 'react'
import { Button, Input, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, makeStyles, tokens, Tooltip, Badge, Menu, MenuTrigger, MenuButton, MenuPopover, MenuList, MenuItem, MenuDivider, Checkbox, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Dropdown, Option } from '@fluentui/react-components'
import { notifyInfo } from '../lib/notify'
import { emailService } from '../services/emailService'
import { Email } from '../types'
import { BackendEmailMessage } from '../types/email'
import { mapBackendEmailToEmail } from '../lib/mappers'
import { changeService } from '../services/changeService'
import { withBackoff } from '../lib/backoff'
import { useCategories } from '../hooks/useCategories'
import { BulkMoveResponse } from '../types/bulkMove'
import { recentlyCategorizedStore } from '../stores/recentlyCategorized'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: tokens.spacingHorizontalXL,
    height: '100%',
    minHeight: 0,
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchInput: {
    borderRadius: '10px',
    '& input': {
      fontSize: '13px',
    },
  },
  searchButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
  },
  secondaryButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
  },
  primaryButton: {
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600' as any,
    background: 'linear-gradient(135deg, #0f6cbd 0%, #2563eb 100%) !important',
    border: 'none !important',
    boxShadow: '0 2px 8px rgba(15, 108, 189, 0.3)',
    transition: 'all 0.2s ease',
    ':hover:not(:disabled)': {
      boxShadow: '0 4px 16px rgba(15, 108, 189, 0.4)',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  listWrap: {
    flex: 1,
    overflow: 'auto',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    padding: tokens.spacingVerticalS,
  },
  table: { minWidth: '320px', tableLayout: 'fixed' },
  subjectCell: { width: '60%' },
  truncated: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
    fontSize: '14px',
    color: '#1e293b',
    lineHeight: '1.5',
  },
  tableHeader: {
    fontSize: '13px',
    fontWeight: '600' as any,
    color: '#475569',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: '14px',
    color: '#1e293b',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    lineHeight: '1.5',
  },
  tableRow: {
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    ':hover': {
      backgroundColor: '#f0f7ff',
    },
    ':last-child': {
      borderBottom: 'none',
    },
  },
  pager: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    padding: '12px 0',
    justifyContent: 'space-between',
  },
  pagerGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  pagerText: {
    fontSize: '13px',
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  pagerButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
  },
  pageSizeDropdown: {
    minWidth: '72px',
    '& .fui-Dropdown': {
      borderRadius: '10px',
    },
  },
  narrowHide: { '@media (max-width: 420px)': { display: 'none' } },
  error: {
    fontSize: '13px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid #fecaca',
  },
  dialogSurface: {
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  dialogTable: {
    maxHeight: '280px',
    overflow: 'auto',
    border: '1px solid #f1f5f9',
    borderRadius: '10px',
  },
})

type Props = {
  onSelect: (email: Email) => void
  categoryFilter?: { categoryId?: string; folderId?: string }
}

const mapToEmail = (m: BackendEmailMessage): Email => mapBackendEmailToEmail(m)

const EmailList: React.FC<Props> = ({ onSelect, categoryFilter }) => {
  const styles = useStyles()
  const [items, setItems] = useState<Email[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [top, setTop] = useState(10)
  const [skip, setSkip] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [planOpen, setPlanOpen] = useState(false)
  const [planLoading, setPlanLoading] = useState(false)
  const [planResponse, setPlanResponse] = useState<BulkMoveResponse | null>(null)
  const [minConfidence, setMinConfidence] = useState<number | undefined>(undefined)
  const { categories } = useCategories()

  // Keep latest values to avoid stale closures inside the change subscription
  const latestQueryRef = useRef<string>('')
  const latestTopRef = useRef<number>(50)
  useEffect(() => { latestQueryRef.current = debouncedQ }, [debouncedQ])
  useEffect(() => { latestTopRef.current = top }, [top])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  // If a category filter is provided, reset paging and fetch with the filter applied
  useEffect(() => {
    if (!categoryFilter) return
    setSkip(0)
    // re-fetch with current debounced query + filter applied client-side post-fetch
    fetchEmails(latestQueryRef.current, latestTopRef.current, 0)
  }, [categoryFilter])

  const fetchEmails = async (q: string, t: number, s: number, signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const fetchPage = async (topArg: number, skipArg: number) => {
        const data = q
          ? await emailService.search(q, topArg, skipArg, signal)
          : await emailService.list(topArg, skipArg, signal)
        return data.map(mapToEmail)
      }

      // If no category filter, just fetch a single page
      if (!categoryFilter) {
        const mapped = await fetchPage(t, s)
        setItems(mapped)
        return
      }

      // With a category filter, fetch a larger chunk once to avoid multiple round-trips
      const CHUNK_MULTIPLIER = 5
      const chunkTop = Math.min(250, t * CHUNK_MULTIPLIER)
      const page1 = await fetchPage(chunkTop, s)
      const f1 = page1.filter(m => (
        (categoryFilter.categoryId && m.categoryId === categoryFilter.categoryId) ||
        (categoryFilter.folderId && m.parentFolderId === categoryFilter.folderId)
      ))
      if (f1.length >= t || page1.length < chunkTop) {
        setItems(f1.slice(0, t))
        return
      }
      // Fallback: fetch one more chunk if needed
      const page2 = await fetchPage(chunkTop, s + chunkTop)
      const f2 = page2.filter(m => (
        (categoryFilter.categoryId && m.categoryId === categoryFilter.categoryId) ||
        (categoryFilter.folderId && m.parentFolderId === categoryFilter.folderId)
      ))
      const collected = f1.concat(f2)
      setItems(collected.slice(0, t))
    } catch (e: any) {
      const isCanceled = e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED' || e?.message === 'canceled' || e?.cause?.name === 'AbortError'
      if (!isCanceled) setError(e?.message || 'Failed to load emails')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const ac = new AbortController()
    fetchEmails(debouncedQ, top, skip, ac.signal)
    return () => { ac.abort() }
  }, [debouncedQ, top, skip, categoryFilter?.categoryId, categoryFilter?.folderId])

  useEffect(() => {
    const unsubscribe = changeService.subscribe(items => {
      const hasRelevant = items?.some(it => it?.type === 'email:moved' || it?.type === 'email:bulk-moved')
      if (hasRelevant) {
        setSkip(0)
        setSelectedIds(new Set())
        const run = async () => {
          // Try a few times in case backend cache (~10s) returns a stale page
          let attempts = 0
          while (attempts < 3) {
            await fetchEmails(latestQueryRef.current, latestTopRef.current, 0)
            attempts += 1
            if (attempts < 3) await new Promise(r => setTimeout(r, 3000))
          }
        }
        run()
      }
    })
    return () => { unsubscribe() }
    // Intentionally omit deps to keep a single subscription; we read latest values via parameters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nextPage = () => setSkip(s => s + top)
  const prevPage = () => setSkip(s => Math.max(0, s - top))

  const toggleSelectAllCurrentPage = () => {
    const pageIds = items.map(it => it.id)
    const allSelected = pageIds.every(id => selectedIds.has(id))
    if (allSelected) {
      const newSet = new Set(selectedIds)
      pageIds.forEach(id => newSet.delete(id))
      setSelectedIds(newSet)
    } else {
      const newSet = new Set(selectedIds)
      pageIds.forEach(id => newSet.add(id))
      setSelectedIds(newSet)
    }
  }

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const headerAllChecked = items.length > 0 && items.every(it => selectedIds.has(it.id))
  const headerIndeterminate = items.some(it => selectedIds.has(it.id)) && !headerAllChecked

  const openPredictivePlan = async () => {
    const messageIds = Array.from(selectedIds)
    if (messageIds.length === 0) return
    setPlanLoading(true)
    setPlanOpen(true)
    try {
      const resp = await emailService.bulkMove({ messageIds, dryRun: true, minConfidence })
      setPlanResponse(resp)
    } catch (e) {
      setPlanResponse(null)
    } finally {
      setPlanLoading(false)
    }
  }

  const executePredictive = async () => {
    const messageIds = Array.from(selectedIds)
    if (messageIds.length === 0) return
    const resp = await emailService.bulkMove({ messageIds, dryRun: false, minConfidence })
    try {
      const movedIds = resp?.data?.results?.filter(r => r.ok)?.map(r => r.messageId) || []
      if (movedIds.length > 0) recentlyCategorizedStore.mark(movedIds)
    } catch {}
    setPlanOpen(false)
    setPlanResponse(null)
    setSelectedIds(new Set())
    notifyInfo('Bulk move requested', 'Changes will appear shortly')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Input value={q} onChange={(_, d) => setQ(d.value)} placeholder="Search emails" className={styles.searchInput} style={{ width: 240 }} />
        <Button size="small" className={styles.searchButton} appearance="secondary" onClick={() => { setSkip(0); setDebouncedQ(q) }}>Search</Button>
        {loading && <Spinner size="tiny" />}
        {error && <Text className={styles.error} role="alert">{error}</Text>}
        {!loading && (
          <Button className={`${styles.narrowHide} ${styles.secondaryButton}`} size="small" appearance="secondary" onClick={() => { setSkip(0); fetchEmails(debouncedQ, top, 0); notifyInfo('Refreshed', 'Latest categorization applied'); }}>Refresh</Button>
        )}
        <Button size="small" appearance="primary" className={styles.primaryButton} disabled={selectedIds.size === 0} onClick={openPredictivePlan}>AI Categorize</Button>
      </div>

      <div className={styles.listWrap}>
        <Table size="medium" className={styles.table}>
          <TableHeader>
            <TableRow style={{ borderBottom: '2px solid rgba(0,0,0,0.08)' }}>
              <TableHeaderCell className={styles.tableHeader} style={{ width: '40px' }}>
                <Checkbox checked={headerAllChecked ? true : headerIndeterminate ? 'mixed' : false} onChange={toggleSelectAllCurrentPage} />
              </TableHeaderCell>
              <TableHeaderCell className={styles.tableHeader}>Subject</TableHeaderCell>
              <TableHeaderCell className={`${styles.narrowHide} ${styles.tableHeader}`}>From</TableHeaderCell>
              <TableHeaderCell className={`${styles.narrowHide} ${styles.tableHeader}`}>Date</TableHeaderCell>
              <TableHeaderCell className={styles.tableHeader}>Status</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(it => (
              <TableRow key={it.id} className={styles.tableRow} onClick={() => onSelect(it)} style={{ cursor: 'pointer' }}>
                <TableCell style={{ width: '40px', padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}` }}>
                  <Checkbox
                    checked={selectedIds.has(it.id)}
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggleSelectOne(it.id)}
                  />
                </TableCell>
                <TableCell className={`${styles.subjectCell} ${styles.tableCell}`}>
                  <Tooltip content={it.subject} relationship="label">
                    <span className={styles.truncated} style={{ fontWeight: '500' }}>{it.subject || '(No subject)'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell className={`${styles.narrowHide} ${styles.tableCell}`}>
                  <Tooltip content={it.sender} relationship="label">
                    <span className={styles.truncated} style={{ color: '#475569' }}>{it.sender}</span>
                  </Tooltip>
                </TableCell>
                <TableCell className={`${styles.narrowHide} ${styles.tableCell}`}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>{it.receivedDate.toLocaleString()}</span>
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge appearance="filled" color={it.isProcessed ? 'success' : 'subtle'} size="small" style={{ fontSize: '11px', borderRadius: '6px', padding: '2px 8px' }}>
                      {it.isProcessed ? 'Done' : 'New'}
                    </Badge>
                    {Array.isArray(it.categories) && it.categories.length > 0 && it.categories.slice(0, 3).map(label => (
                      <Badge key={label} size="small" appearance="tint" style={{ fontSize: '11px', padding: '2px 8px' }}>{label}</Badge>
                    ))}
                    {Array.isArray(it.categories) && it.categories.length > 3 && (
                      <Badge size="small" appearance="tint" style={{ fontSize: '11px', padding: '2px 8px' }}>+{it.categories.length - 3}</Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className={styles.pager}>
        <div className={styles.pagerGroup}>
          <Button size="small" className={styles.pagerButton} appearance="secondary" onClick={prevPage} disabled={skip === 0}>Prev</Button>
          <Text className={styles.pagerText}>Page {Math.floor(skip / top) + 1}</Text>
          <Button size="small" className={styles.pagerButton} appearance="secondary" onClick={nextPage}>Next</Button>
        </div>
        <div className={styles.pagerGroup}>
          <Text className={styles.pagerText}>Show</Text>
          <Dropdown
            value={String(top)}
            onOptionSelect={(_, d) => { setTop(Number(d.optionValue)); setSkip(0); }}
            size="small"
            className={styles.pageSizeDropdown}
            appearance="outline"
          >
            <Option value="10">10</Option>
            <Option value="20">20</Option>
            <Option value="50">50</Option>
          </Dropdown>
          <Text className={styles.pagerText}>per page</Text>
        </div>
      </div>

      <Dialog open={planOpen} onOpenChange={(_, d) => setPlanOpen(d.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>AI Categorization Plan</DialogTitle>
            <DialogContent>
              {planLoading && <Spinner size="tiny" />}
              {!planLoading && planResponse && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <Badge appearance="filled" size="small">Selected: {selectedIds.size}</Badge>
                    <Badge appearance="filled" color="brand" size="small">To move: {planResponse.data.results.filter(r => r.reason === 'dry_run').length}</Badge>
                    <Badge appearance="filled" color="important" size="small">Skipped: {planResponse.data.results.filter(r => r.reason !== 'dry_run').length}</Badge>
                  </div>
                  <div className={styles.dialogTable}>
                    <Table size="small" className={styles.table}>
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Subject</TableHeaderCell>
                          <TableHeaderCell>Suggested Category</TableHeaderCell>
                          <TableHeaderCell>Action</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planResponse.data.results.map(r => {
                          const email = items.find(it => it.id === r.messageId)
                          const catName = r.predictedCategoryId ? (categories.find(c => c.id === r.predictedCategoryId)?.name || r.predictedCategoryId) : '-'
                          const action = r.reason === 'dry_run' ? 'Move' : `Skip (${r.reason || 'n/a'})`
                          return (
                            <TableRow key={r.messageId}>
                              <TableCell>
                                <span className={styles.truncated} title={email?.subject || r.messageId}>{email?.subject || r.messageId}</span>
                              </TableCell>
                              <TableCell>{catName}</TableCell>
                              <TableCell>{action}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              {!planLoading && !planResponse && (
                <Text>Failed to fetch plan</Text>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" size="small" className={styles.secondaryButton} onClick={() => setPlanOpen(false)}>Close</Button>
              <Button appearance="primary" size="small" className={styles.primaryButton} onClick={executePredictive} disabled={!planResponse || planLoading}>Categorize</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}

export default EmailList



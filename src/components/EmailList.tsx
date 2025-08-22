import React, { useEffect, useRef, useState } from 'react'
import { Button, Input, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, makeStyles, tokens, Tooltip, Badge, Menu, MenuTrigger, MenuButton, MenuPopover, MenuList, MenuItem, MenuDivider, Checkbox, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions } from '@fluentui/react-components'
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
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM, height: '100%', minHeight: 0, overflow: 'auto' },
  header: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' },
  listWrap: { flex: 1, overflow: 'auto', border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium },
  table: { minWidth: '320px', tableLayout: 'fixed' },
  subjectCell: { width: '60%' },
  truncated: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  pager: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  narrowHide: { '@media (max-width: 420px)': { display: 'none' } },
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
        <Input value={q} onChange={(_, d) => setQ(d.value)} placeholder="Search emails" style={{ width: 240 }} />
        <Button size="small" onClick={() => { setSkip(0); setDebouncedQ(q) }}>Search</Button>
        {loading && <Spinner size="tiny" />}
        {error && <Text color="danger">{error}</Text>}
        {!loading && (
          <Button className={styles.narrowHide} size="small" appearance="secondary" onClick={() => { setSkip(0); fetchEmails(debouncedQ, top, 0); notifyInfo('Refreshed', 'Latest categorization applied'); }}>Refresh</Button>
        )}
        <Button size="small" appearance="primary" disabled={selectedIds.size === 0} onClick={openPredictivePlan}>AI Categorize</Button>
      </div>

      <div className={styles.listWrap}>
        <Table size="small" className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Checkbox checked={headerAllChecked ? true : headerIndeterminate ? 'mixed' : false} onChange={toggleSelectAllCurrentPage} />
              </TableHeaderCell>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell className={styles.narrowHide}>From</TableHeaderCell>
              <TableHeaderCell className={styles.narrowHide}>Date</TableHeaderCell>
              <TableHeaderCell>St</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(it => (
              <TableRow key={it.id} onClick={() => onSelect(it)} style={{ cursor: 'pointer' }}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(it.id)}
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggleSelectOne(it.id)}
                  />
                </TableCell>
                <TableCell className={styles.subjectCell}>
                  <Tooltip content={it.subject} relationship="label">
                    <span className={styles.truncated}>{it.subject}</span>
                  </Tooltip>
                </TableCell>
                <TableCell className={styles.narrowHide}>
                  <Tooltip content={it.sender} relationship="label">
                    <span className={styles.truncated}>{it.sender}</span>
                  </Tooltip>
                </TableCell>
                <TableCell className={styles.narrowHide}>
                  <span>{it.receivedDate.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge appearance="filled" color={it.isProcessed ? 'success' : 'subtle'} size="small">
                      {it.isProcessed ? 'Done' : 'New'}
                    </Badge>
                    {Array.isArray(it.categories) && it.categories.length > 0 && it.categories.slice(0, 3).map(label => (
                      <Badge key={label} size="small" appearance="tint">{label}</Badge>
                    ))}
                    {Array.isArray(it.categories) && it.categories.length > 3 && (
                      <Badge size="small" appearance="tint">+{it.categories.length - 3}</Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className={styles.pager}>
        <Button size="small" onClick={prevPage} disabled={skip === 0}>Previous</Button>
        <Text size={100}>Page {Math.floor(skip / top) + 1}</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" appearance={top === 10 ? 'primary' : 'secondary'} onClick={() => { setTop(10); setSkip(0) }}>10</Button>
          <Button size="small" appearance={top === 20 ? 'primary' : 'secondary'} onClick={() => { setTop(20); setSkip(0) }}>20</Button>
          <Button size="small" appearance={top === 50 ? 'primary' : 'secondary'} onClick={() => { setTop(50); setSkip(0) }}>50</Button>
        </div>
        <Button size="small" onClick={nextPage}>Next</Button>
      </div>

      <Dialog open={planOpen} onOpenChange={(_, d) => setPlanOpen(d.open)}>
        <DialogSurface>
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
                  <div style={{ maxHeight: 280, overflow: 'auto', border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusSmall }}>
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
              <Button appearance="secondary" size="small" onClick={() => setPlanOpen(false)}>Close</Button>
              <Button appearance="primary" size="small" onClick={executePredictive} disabled={!planResponse || planLoading}>Categorize</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}

export default EmailList



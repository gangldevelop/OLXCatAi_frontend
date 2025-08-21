import React, { useEffect, useRef, useState } from 'react'
import { Button, Input, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, makeStyles, tokens, Tooltip, Badge, Menu, MenuTrigger, MenuButton, MenuPopover, MenuList, MenuItem, MenuDivider } from '@fluentui/react-components'
import { notifyInfo } from '../lib/notify'
import { emailService } from '../services/emailService'
import { Email } from '../types'
import { BackendEmailMessage } from '../types/email'
import { mapBackendEmailToEmail } from '../lib/mappers'
import { changeService } from '../services/changeService'
import { withBackoff } from '../lib/backoff'

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM, height: '100%', minHeight: 0, overflow: 'auto' },
  header: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' },
  listWrap: { flex: 1, overflow: 'auto', border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium },
  table: { minWidth: '360px', tableLayout: 'fixed' },
  subjectCell: { width: '52%' },
  truncated: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  pager: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  narrowHide: { '@media (max-width: 420px)': { display: 'none' } },
})

type Props = {
  onSelect: (email: Email) => void
}

const mapToEmail = (m: BackendEmailMessage): Email => mapBackendEmailToEmail(m)

const EmailList: React.FC<Props> = ({ onSelect }) => {
  const styles = useStyles()
  const [items, setItems] = useState<Email[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [top, setTop] = useState(10)
  const [skip, setSkip] = useState(0)

  // Keep latest values to avoid stale closures inside the change subscription
  const latestQueryRef = useRef<string>('')
  const latestTopRef = useRef<number>(50)
  useEffect(() => { latestQueryRef.current = debouncedQ }, [debouncedQ])
  useEffect(() => { latestTopRef.current = top }, [top])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  const fetchEmails = async (q: string, t: number, s: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await withBackoff(async () => {
        if (q) {
          return emailService.search(q, t, s)
        }
        return emailService.list(t, s)
      })
      setItems(data.map(mapToEmail))
    } catch (e: any) {
      setError(e?.message || 'Failed to load emails')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmails(debouncedQ, top, skip) }, [debouncedQ, top, skip])

  useEffect(() => {
    const unsubscribe = changeService.subscribe(items => {
      const hasRelevant = items?.some(it => it?.type === 'email:moved' || it?.type === 'email:bulk-moved')
      if (hasRelevant) {
        setSkip(0)
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Input value={q} onChange={(_, d) => setQ(d.value)} placeholder="Search emails" style={{ width: 240 }} />
        <Button size="small" onClick={() => { setSkip(0); setDebouncedQ(q) }}>Search</Button>
        {loading && <Spinner size="tiny" />}
        {error && <Text color="danger">{error}</Text>}
        {!loading && (
          <Button size="small" appearance="secondary" onClick={() => { setSkip(0); fetchEmails(debouncedQ, top, 0); notifyInfo('Refreshed', 'Latest categorization applied'); }}>Refresh</Button>
        )}
      </div>

      <div className={styles.listWrap}>
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell className={styles.narrowHide}>From</TableHeaderCell>
              <TableHeaderCell className={styles.narrowHide}>Date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(it => (
              <TableRow key={it.id} onClick={() => onSelect(it)} style={{ cursor: 'pointer' }}>
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
                  <Badge appearance="filled" color={it.isProcessed ? 'success' : 'subtle'} size="small">
                    {it.isProcessed ? 'Read' : 'Unread'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className={styles.pager}>
        <Text size={100}>Pg {Math.floor(skip / top) + 1}</Text>
        <Menu>
          <MenuTrigger>
            <MenuButton size="small" appearance="secondary">Actions</MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem onClick={prevPage} disabled={skip === 0}>Previous Page</MenuItem>
              <MenuItem onClick={nextPage}>Next Page</MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => { setTop(10); setSkip(0) }}>10 / page</MenuItem>
              <MenuItem onClick={() => { setTop(20); setSkip(0) }}>20 / page</MenuItem>
              <MenuItem onClick={() => { setTop(50); setSkip(0) }}>50 / page</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </div>
  )
}

export default EmailList



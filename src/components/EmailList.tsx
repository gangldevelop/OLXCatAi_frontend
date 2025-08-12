import React, { useEffect, useMemo, useState } from 'react'
import { Button, Input, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, makeStyles, tokens, Tooltip, Badge } from '@fluentui/react-components'
import { emailService } from '../services/emailService'
import { Email } from '../types'
import { BackendEmailMessage } from '../types/email'
import { mapBackendEmailToEmail } from '../lib/mappers'

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM, height: '100%', minHeight: 0, overflow: 'auto' },
  header: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' },
  listWrap: { flex: 1, overflow: 'auto', border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium },
  table: { minWidth: '620px', tableLayout: 'fixed' },
  subjectCell: { width: '52%' },
  truncated: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  pager: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  narrowHide: { '@media (max-width: 360px)': { display: 'none' } },
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
  const [top, setTop] = useState(20)
  const [skip, setSkip] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      if (debouncedQ) {
        const data = await emailService.search(debouncedQ, top, skip)
        setItems(data.map(mapToEmail))
      } else {
        const data = await emailService.list(top, skip)
        setItems(data.map(mapToEmail))
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load emails')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [debouncedQ, top, skip])

  const nextPage = () => setSkip(s => s + top)
  const prevPage = () => setSkip(s => Math.max(0, s - top))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Input value={q} onChange={(_, d) => setQ(d.value)} placeholder="Search emails" style={{ width: 240 }} />
        <Button size="small" onClick={() => { setSkip(0); setDebouncedQ(q) }}>Search</Button>
        {loading && <Spinner size="tiny" />}
        {error && <Text color="danger">{error}</Text>}
      </div>

      <div className={styles.listWrap}>
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell className="hide-on-narrow">From</TableHeaderCell>
              <TableHeaderCell className="hide-on-narrow">Received</TableHeaderCell>
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
                <TableCell className="hide-on-narrow">
                  <Tooltip content={it.sender} relationship="label">
                    <span className={styles.truncated}>{it.sender}</span>
                  </Tooltip>
                </TableCell>
                <TableCell className="hide-on-narrow">
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
        <Button size="small" disabled={skip === 0} onClick={prevPage}>Previous</Button>
        <Text size={100}>Page {Math.floor(skip / top) + 1}</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={() => setTop(10)} appearance={top === 10 ? 'primary' : 'secondary'}>10</Button>
          <Button size="small" onClick={() => setTop(20)} appearance={top === 20 ? 'primary' : 'secondary'}>20</Button>
          <Button size="small" onClick={() => setTop(50)} appearance={top === 50 ? 'primary' : 'secondary'}>50</Button>
        </div>
        <Button size="small" onClick={nextPage}>Next</Button>
      </div>
    </div>
  )
}

export default EmailList



import * as React from 'react'
import {
  makeStyles,
  Button,
  Spinner,
  Input,
  Label,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@fluentui/react-components'
import { reportsService, adminReportsService } from '../services/reportsService'
import { adminService } from '../services/adminService'
import type { ReportsSummary, TopCategory, Category } from '../types'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'stretch',
    padding: '20px 24px',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
  },
  field: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600' as any,
    color: '#0f172a',
  },
  input: {
    borderRadius: '10px',
    '& input': {
      fontSize: '13px',
    },
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
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
  error: {
    fontSize: '13px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #fecaca',
    lineHeight: '1.4',
  },
  summarySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    '@media (max-width: 350px)': {
      gridTemplateColumns: '1fr',
    },
  },
  kpiCard: {
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
  },
  kpiLabel: {
    fontSize: '13px',
    fontWeight: '600' as any,
    color: '#1e293b',
    lineHeight: '1.3',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: '700' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  kpiDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f1f5f9',
    margin: '4px 0',
  },
  tableSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px 24px',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    fontSize: '15px',
    fontWeight: '600' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  tableWrap: {
    overflowX: 'auto',
    borderRadius: '10px',
    '& table': {
      fontSize: '13px',
    },
    '& th, & td': {
      padding: '10px 12px',
      fontSize: '13px',
      color: '#1e293b',
    },
    '& th': {
      fontSize: '12px',
      fontWeight: '600' as any,
      color: '#64748b',
    },
  },
  barCell: { display: 'flex', alignItems: 'center', columnGap: '8px' },
  bar: {
    height: '8px',
    background: 'linear-gradient(90deg, #0f6cbd 0%, #3b82f6 100%)',
    borderRadius: '4px',
  },
})

function formatISO(d: Date) {
  return d.toISOString()
}
function pct(n: number | null | undefined) {
  return n == null ? '—' : `${Math.round(n * 100)}%`
}
function num(n: number | null | undefined, d = 2) {
  return n == null ? '—' : n.toFixed(d)
}

type Props = { categories: Category[] }

export function ReportingDashboardFluent({ categories }: Props) {
  const styles = useStyles()
  const [from, setFrom] = React.useState(() => formatISO(new Date(Date.now() - 7 * 864e5)))
  const [to, setTo] = React.useState(() => formatISO(new Date()))
  const [loading, setLoading] = React.useState(false)
  const [summary, setSummary] = React.useState<ReportsSummary | null>(null)
  const [topCats, setTopCats] = React.useState<TopCategory[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isAdmin, setIsAdmin] = React.useState<boolean>(false)
  const [probing, setProbing] = React.useState<boolean>(false)
  const [teamId, setTeamId] = React.useState<string>('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (isAdmin) {
        const [s, t] = await Promise.all([
          adminReportsService.summary(from, to),
          adminReportsService.topCategories(teamId || undefined),
        ])
        setSummary(s)
        setTopCats((t || []).map(tc => ({ categoryId: tc.categoryId, count: tc.count, name: tc.name || null })) as any)
      } else {
        const [s, t] = await Promise.all([
          reportsService.summary(from, to),
          reportsService.topCategories(from, to),
        ])
        setSummary(s)
        setTopCats(t)
      }
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 403) {
        setIsAdmin(false)
        setError("You don't have admin permissions for this organization.")
      } else {
        setError(e?.message || 'Failed to load reports')
      }
    } finally {
      setLoading(false)
    }
  }, [from, to, isAdmin, teamId])

  React.useEffect(() => {
    void load()
  }, [load])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      setProbing(true)
      try {
        const ok = await adminService.probeAccess()
        if (mounted) setIsAdmin(!!ok)
      } catch {
        if (mounted) setIsAdmin(false)
      } finally {
        if (mounted) setProbing(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const last7 = () => {
    setFrom(formatISO(new Date(Date.now() - 7 * 864e5)))
    setTo(formatISO(new Date()))
  }
  const last30 = () => {
    setFrom(formatISO(new Date(Date.now() - 30 * 864e5)))
    setTo(formatISO(new Date()))
  }
  const maxCount = topCats.reduce((m, c) => Math.max(m, c.count), 0) || 1

  const getCategoryName = (categoryId: string) => {
    const c = categories.find(cat => cat.id === categoryId)
    return c ? c.name : categoryId
  }

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <Label htmlFor="from" className={styles.label}>From</Label>
          <Input
            id="from"
            type="datetime-local"
            className={styles.input}
            value={from.slice(0, 16)}
            onChange={e => setFrom(new Date((e as any).currentTarget.value).toISOString())}
          />
        </div>
        <div className={styles.field}>
          <Label htmlFor="to" className={styles.label}>To</Label>
          <Input
            id="to"
            type="datetime-local"
            className={styles.input}
            value={to.slice(0, 16)}
            onChange={e => setTo(new Date((e as any).currentTarget.value).toISOString())}
          />
        </div>
        {isAdmin && (
          <div className={styles.field}>
            <Label htmlFor="teamId" className={styles.label}>Team (optional)</Label>
            <Input id="teamId" className={styles.input} value={teamId} onChange={e => setTeamId((e as any).currentTarget.value)} placeholder="teamId" />
          </div>
        )}
        <div className={styles.buttonGroup}>
          <Button size="small" appearance="secondary" className={styles.secondaryButton} onClick={last7}>
            Last 7 days
          </Button>
          <Button size="small" appearance="secondary" className={styles.secondaryButton} onClick={last30}>
            Last 30 days
          </Button>
          <Button size="small" appearance="primary" className={styles.primaryButton} onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>

      {loading && <Spinner label="Loading reports…" />}
      {error && <div className={styles.error} role="alert">Error: {error}</div>}

      {summary && (
        <section className={styles.summarySection}>
          <div className={styles.sectionHeader}>Summary</div>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Auto-moved</span>
              <div className={styles.kpiValue}>{summary.autoMoved}</div>
              <div className={styles.kpiDesc}>in range</div>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Skipped (threshold)</span>
              <div className={styles.kpiValue}>{summary.skippedBelowThreshold}</div>
              <div className={styles.kpiDesc}>below confidence</div>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Feedback corrections</span>
              <div className={styles.kpiValue}>{summary.feedbackCorrections}</div>
              <div className={styles.kpiDesc}>user adjustments</div>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Avg confidence</span>
              <div className={styles.kpiValue}>{num(summary.avgConfidence)}</div>
              <div className={styles.kpiDesc}>0–1</div>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Attachment usage</span>
              <div className={styles.kpiValue}>{pct(summary.attachmentUsageRate)}</div>
              <div className={styles.kpiDesc}>of events</div>
            </div>
          </div>
        </section>
      )}

      <div className={styles.divider} />
      <section className={styles.tableSection}>
        <div className={styles.sectionHeader}>{isAdmin ? 'Top Categories (Admin scope)' : 'Top Categories (auto-moved)'}</div>
        <div className={styles.tableWrap}>
        <Table aria-label="Top categories">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Count</TableHeaderCell>
              <TableHeaderCell>Bar</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCats.map((c: any) => (
              <TableRow key={c.categoryId}>
                <TableCell>{c.name || getCategoryName(c.categoryId)}</TableCell>
                <TableCell>{c.count}</TableCell>
                <TableCell>
                  <div className={styles.barCell}>
                    <div
                      className={styles.bar}
                      style={{ width: `${Math.round((c.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {topCats.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>No data for this range.</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </section>
    </div>
  )
}

export default ReportingDashboardFluent



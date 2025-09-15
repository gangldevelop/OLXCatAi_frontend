import * as React from 'react'
import {
  makeStyles,
  shorthands,
  tokens,
  Card,
  Subtitle2,
  Body1,
  Button,
  Spinner,
  Input,
  Label,
  Divider,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Title3,
} from '@fluentui/react-components'
import { reportsService, adminReportsService } from '../services/reportsService'
import { adminService } from '../services/adminService'
import type { ReportsSummary, TopCategory, Category } from '../types'

const useStyles = makeStyles({
  root: {
    display: 'grid',
    rowGap: '12px',
    maxWidth: '350px',
    width: '100%',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '8px',
    alignItems: 'stretch',
  },
  field: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    columnGap: '8px',
    rowGap: '8px',
    '@media (max-width: 350px)': {
      gridTemplateColumns: '1fr',
    },
  },
  kpiCard: { ...shorthands.padding('8px'), display: 'flex', flexDirection: 'column', rowGap: '2px' },
  kpiValue: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: 600,
    '@media (max-width: 420px)': { fontSize: tokens.fontSizeBase200 },
  },
  kpiLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
  },
  tableWrap: { 
    overflowX: 'auto',
    '& table': {
      fontSize: tokens.fontSizeBase100,
    },
    '& th, & td': {
      padding: '4px 6px',
      fontSize: tokens.fontSizeBase100,
    },
  },
  barCell: { display: 'flex', alignItems: 'center', columnGap: '8px' },
  bar: { height: '8px', backgroundColor: tokens.colorBrandBackground, ...shorthands.borderRadius('4px') },
  sectionHeader: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
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
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="datetime-local"
            value={from.slice(0, 16)}
            onChange={e => setFrom(new Date((e as any).currentTarget.value).toISOString())}
          />
        </div>
        <div className={styles.field}>
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="datetime-local"
            value={to.slice(0, 16)}
            onChange={e => setTo(new Date((e as any).currentTarget.value).toISOString())}
          />
        </div>
        {isAdmin && (
          <div className={styles.field}>
            <Label htmlFor="teamId">Team (optional)</Label>
            <Input id="teamId" value={teamId} onChange={e => setTeamId((e as any).currentTarget.value)} placeholder="teamId" />
          </div>
        )}
        <Button size="small" appearance="secondary" onClick={last7}>
          Last 7 days
        </Button>
        <Button size="small" appearance="secondary" onClick={last30}>
          Last 30 days
        </Button>
        <Button size="small" appearance="primary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {loading && <Spinner label="Loading reports…" />}
      {error && <Body1 role="alert">Error: {error}</Body1>}

      {summary && (
        <section>
          <div className={styles.sectionHeader}>Summary</div>
          <div className={styles.kpiGrid}>
            <Card className={styles.kpiCard}>
              <Subtitle2>Auto-moved</Subtitle2>
              <div className={styles.kpiValue}>{summary.autoMoved}</div>
              <div className={styles.kpiLabel}>in range</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Subtitle2>Skipped (threshold)</Subtitle2>
              <div className={styles.kpiValue}>{summary.skippedBelowThreshold}</div>
              <div className={styles.kpiLabel}>below confidence</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Subtitle2>Feedback corrections</Subtitle2>
              <div className={styles.kpiValue}>{summary.feedbackCorrections}</div>
              <div className={styles.kpiLabel}>user adjustments</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Subtitle2>Avg confidence</Subtitle2>
              <div className={styles.kpiValue}>{num(summary.avgConfidence)}</div>
              <div className={styles.kpiLabel}>0–1</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Subtitle2>Attachment usage</Subtitle2>
              <div className={styles.kpiValue}>{pct(summary.attachmentUsageRate)}</div>
              <div className={styles.kpiLabel}>of events</div>
            </Card>
          </div>
        </section>
      )}

      <Divider />
      <section>
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
                  <Body1>No data for this range.</Body1>
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



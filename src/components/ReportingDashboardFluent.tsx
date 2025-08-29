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
import { reportsService } from '../services/reportsService'
import type { ReportsSummary, TopCategory, Category } from '../types'

const useStyles = makeStyles({
  root: {
    display: 'grid',
    rowGap: '16px',
    minWidth: '360px',
  },
  controls: {
    display: 'flex',
    columnGap: '12px',
    rowGap: '8px',
    alignItems: 'end',
    flexWrap: 'wrap',
  },
  field: {
    minWidth: '160px',
    '@media (max-width: 480px)': {
      width: '100%',
    },
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(140px, 1fr))',
    columnGap: '12px',
    rowGap: '12px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
    '@media (max-width: 640px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 420px)': {
      gridTemplateColumns: '1fr',
    },
  },
  kpiCard: { ...shorthands.padding('10px'), display: 'flex', flexDirection: 'column', rowGap: '2px' },
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
  tableWrap: { overflowX: 'auto' },
  barCell: { display: 'flex', alignItems: 'center', columnGap: '8px' },
  bar: { height: '8px', backgroundColor: tokens.colorBrandBackground, ...shorthands.borderRadius('4px') },
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

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, t] = await Promise.all([
        reportsService.summary(from, to),
        reportsService.topCategories(from, to),
      ])
      setSummary(s)
      setTopCats(t)
    } catch (e: any) {
      setError(e?.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  React.useEffect(() => {
    void load()
  }, [load])

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
          <Title3>Summary</Title3>
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
        <Title3>Top Categories (auto-moved)</Title3>
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
            {topCats.map(c => (
              <TableRow key={c.categoryId}>
                <TableCell>{getCategoryName(c.categoryId)}</TableCell>
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



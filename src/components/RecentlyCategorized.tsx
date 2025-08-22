import React, { useEffect, useMemo, useState } from 'react'
import { Button, Dropdown, Option, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, makeStyles, tokens, Badge, Input, Menu, MenuTrigger, MenuButton, MenuPopover, MenuList, MenuItem } from '@fluentui/react-components'
import { Email, Category } from '../types'
import { emailService } from '../services/emailService'
import { recentlyCategorizedStore } from '../stores/recentlyCategorized'
import { notifyError, notifyInfo, notifySuccess } from '../lib/notify'
import { EditRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  container: { padding: tokens.spacingHorizontalM, border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalS, gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },
  listWrap: { overflowX: 'auto', overflowY: 'auto', maxHeight: '220px' },
  table: { minWidth: '280px', tableLayout: 'fixed' },
  subjectCell: { width: 'auto' },
  truncated: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  narrowHide: { '@media (max-width: 480px)': { display: 'none' } },
  actionCell: { width: '48px', textAlign: 'right' },
})

type Props = {
  emails: Email[]
  categories: Category[]
  onEmailUpdated: (id: string, updates: Partial<Email>) => void
}

const RecentlyCategorized: React.FC<Props> = ({ emails, categories, onEmailUpdated }) => {
  const styles = useStyles()
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [debounced, setDebounced] = useState('')
  const [lookbackHours, setLookbackHours] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(filter), 300)
    return () => clearTimeout(t)
  }, [filter])

  const items = useMemo(() => {
    const since = Date.now() - lookbackHours * 60 * 60 * 1000
    const data = emails
      .filter(e => (e.categoryId || (e as any).parentFolderId))
      .map(e => {
        const ts = recentlyCategorizedStore.getTimestampMs(e.id)
        return { email: e, ts: ts ?? e.receivedDate.getTime() }
      })
      .filter(x => x.ts >= since)
      .sort((a, b) => b.ts - a.ts)
      .map(x => x.email)
    if (!debounced) return data
    const q = debounced.toLowerCase()
    return data.filter(e => e.subject.toLowerCase().includes(q) || e.sender.toLowerCase().includes(q))
  }, [emails, debounced, lookbackHours])

  useEffect(() => {
    const unsubscribe = recentlyCategorizedStore.onChange(() => {
      // trigger recompute by updating local state without altering emails
      setLoading(l => l)
    })
    return () => { unsubscribe() }
  }, [])

  const getCategoryName = (categoryId?: string, parentFolderId?: string) => {
    let category = categoryId ? categories.find(c => c.id === categoryId) : undefined
    if (!category && parentFolderId) category = categories.find(c => c.outlookFolderId === parentFolderId)
    return category?.name || 'Uncategorized'
  }

  const getCategoryColor = (categoryId?: string, parentFolderId?: string) => {
    let category = categoryId ? categories.find(c => c.id === categoryId) : undefined
    if (!category && parentFolderId) category = categories.find(c => c.outlookFolderId === parentFolderId)
    return category?.color || tokens.colorNeutralForeground3
  }

  const handleChangeCategory = async (email: Email, targetCategoryId: string) => {
    setLoading(true)
    try {
      const resp: any = await emailService.feedback(email.id, targetCategoryId, true)
      const moved = resp?.data?.moveResult?.moved === true
      const alreadyIn = resp?.data?.moveResult?.reason === 'already-in-destination'
      const categoryName = getCategoryName(targetCategoryId)
      onEmailUpdated(email.id, { categoryId: targetCategoryId, isProcessed: moved ? true : undefined })
      if (moved) {
        notifySuccess('Learning applied', `Message moved to ${categoryName}.`)
      } else if (alreadyIn) {
        notifyInfo('Already in destination', `Already in ${categoryName}.`)
      } else {
        const hasFolder = !!categories.find(c => c.id === targetCategoryId)?.outlookFolderId
        if (!hasFolder) notifyInfo('Learning applied only', 'Category has no Outlook folder; learning applied only.')
        else notifySuccess('Learning applied', `Category updated to ${categoryName}.`)
      }
    } catch (e: any) {
      notifyError('Feedback failed', e?.message || 'Unable to apply feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text weight="semibold">Recently Categorized</Text>
          <Badge appearance="filled" color="brand" size="small">{items.length}</Badge>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Input value={filter} onChange={(_, d) => setFilter(d.value)} placeholder="Search" style={{ width: 140 }} />
          <Dropdown value={String(lookbackHours)} onOptionSelect={(_, d) => setLookbackHours(Number(d.optionValue))} style={{ minWidth: 100 }}>
            <Option value="1">Last 1 hour</Option>
            <Option value="3">Last 3 hours</Option>
            <Option value="24">Last 24 hours</Option>
            <Option value="72">Last 3 days</Option>
          </Dropdown>
          {loading && <Spinner size="tiny" />}
        </div>
      </div>

      <div className={styles.listWrap}>
        <Table size="small" className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell className={styles.narrowHide}>From</TableHeaderCell>
              <TableHeaderCell className={styles.narrowHide}>Date</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell className={styles.actionCell}>Action</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(e => (
              <TableRow key={e.id}>
                <TableCell className={styles.subjectCell}>
                  <span className={styles.truncated} title={e.subject}>{e.subject}</span>
                </TableCell>
                <TableCell className={styles.narrowHide}>
                  <span className={styles.truncated} title={e.sender}>{e.sender}</span>
                </TableCell>
                <TableCell className={styles.narrowHide}>
                  <span>{e.receivedDate.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: getCategoryColor(e.categoryId, (e as any).parentFolderId) }} />
                    <span className={styles.truncated} title={getCategoryName(e.categoryId, (e as any).parentFolderId)}>
                      {getCategoryName(e.categoryId, (e as any).parentFolderId)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={styles.actionCell}>
                  <Menu>
                    <MenuTrigger>
                      <MenuButton size="small" appearance="subtle" icon={<EditRegular />} aria-label="Change category" />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        {categories.map(c => (
                          <MenuItem key={c.id} onClick={() => handleChangeCategory(e, c.id)}>{c.name}</MenuItem>
                        ))}
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default RecentlyCategorized



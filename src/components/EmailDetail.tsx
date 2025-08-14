import React, { useMemo, useState } from 'react'
import { Button, Dropdown, Option, Spinner, Text, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import DOMPurify from 'dompurify'
import { Email } from '../types'
import { emailService } from '../services/emailService'
import { Category } from '../types'
import { AI_ENABLE } from '../config/env'

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM, height: '100%', minHeight: 0, overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: tokens.spacingHorizontalS },
  body: { border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, padding: tokens.spacingHorizontalM, background: tokens.colorNeutralBackground1, minHeight: '200px' },
})

type Props = {
  email: Email
  categories: Category[]
  onBack: () => void
  onUpdated: (updates: Partial<Email>) => void
}

const EmailDetail: React.FC<Props> = ({ email, categories, onBack, onUpdated }) => {
  const styles = useStyles()
  const [busy, setBusy] = useState(false)
  const [moveTarget, setMoveTarget] = useState<string | undefined>()
  const [predictions, setPredictions] = useState<Array<{ categoryId: string; confidence: number }>>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>()
  const [lowConfidence, setLowConfidence] = useState(false)
  const isHtml = useMemo(() => /<\w+/.test(email.body), [email.body])
  const safeHtml = useMemo(() => (isHtml ? DOMPurify.sanitize(email.body) : ''), [email.body, isHtml])

  const markRead = async () => {
    setBusy(true)
    try {
      await emailService.markRead(email.id)
      onUpdated({ isProcessed: true })
    } finally { setBusy(false) }
  }

  const predict = async () => {
    setBusy(true)
    try {
      const preds = await emailService.predictCategory(email.id)
      setPredictions(preds)
      const top = preds?.[0]
      if (top) {
        setSelectedCategoryId(top.categoryId)
        // low/high confidence UI is gated by backend threshold; UI treats low confidence as suggestion
        // We don't know the threshold from frontend; expose as informational only
        setLowConfidence(false)
      }
    } finally { setBusy(false) }
  }

  const categorize = async (categoryId: string) => {
    setBusy(true)
    try {
      await emailService.categorize(email.id, [categoryId])
      onUpdated({ categoryId })
    } finally { setBusy(false) }
  }

  const move = async () => {
    if (!moveTarget) return
    setBusy(true)
    try {
      await emailService.move(email.id, moveTarget)
      onUpdated({ categoryId: moveTarget })
    } finally { setBusy(false) }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button size="small" onClick={onBack}>Back</Button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button size="small" onClick={markRead} disabled={busy || email.isProcessed}>Mark as read</Button>
          {AI_ENABLE && (
            <Button size="small" onClick={predict} disabled={busy}>Categorize (AI)</Button>
          )}
          <Dropdown value={moveTarget} onOptionSelect={(_, d) => setMoveTarget(d.optionValue as string)} placeholder="Move to..." style={{ minWidth: 160 }}>
            {categories.map(c => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Dropdown>
          <Button size="small" onClick={move} disabled={busy || !moveTarget}>Move</Button>
        </div>
        {busy && <Spinner size="tiny" />}
      </div>

      {AI_ENABLE && predictions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text>
            Suggested: {categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId} (
            {(predictions[0].confidence).toFixed(2)}
            )
          </Text>
          <Button appearance="primary" size="small"
            onClick={async () => {
              if (!selectedCategoryId) return
              setBusy(true)
              try {
                await emailService.move(email.id, selectedCategoryId)
                onUpdated({ categoryId: selectedCategoryId })
              } finally { setBusy(false) }
            }}>
            Apply
          </Button>
          <Dropdown value={selectedCategoryId}
            onOptionSelect={(_, d) => setSelectedCategoryId(d.optionValue as string)}
            placeholder="Choose category"
            style={{ minWidth: 200 }}>
            {categories.map(c => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Dropdown>
          <Button size="small"
            onClick={async () => {
              if (!selectedCategoryId) return
              setBusy(true)
              try {
                await emailService.move(email.id, selectedCategoryId)
                onUpdated({ categoryId: selectedCategoryId })
              } finally { setBusy(false) }
            }}
            disabled={!selectedCategoryId}
          >
            Move
          </Button>
          {lowConfidence && (
            <Tooltip content="Low confidence prediction. Please confirm or choose a category." relationship="label">
              <Text size={200} style={{ color: tokens.colorPaletteRedForeground3 }}>(low confidence)</Text>
            </Tooltip>
          )}
        </div>
      )}

      <div>
        <Text weight="semibold">{email.subject}</Text>
        <div style={{ color: tokens.colorNeutralForeground3 }}>{email.sender} • {email.receivedDate.toLocaleString()}</div>
      </div>

      <div className={styles.body}>
        {isHtml ? (
          <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{email.body}</pre>
        )}
      </div>
    </div>
  )
}

export default EmailDetail



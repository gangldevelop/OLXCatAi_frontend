import React, { useMemo, useState, useEffect } from 'react'
import { Button, Dropdown, Option, Spinner, Text, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import DOMPurify from 'dompurify'
import { Email } from '../types'
import { emailService } from '../services/emailService'
import { Category } from '../types'
import { AI_ENABLE } from '../config/env'
import { notifyError, notifySuccess, notifyInfo } from '../lib/notify'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: tokens.spacingHorizontalXL,
    height: '100%',
    minHeight: 0,
    overflow: 'auto',
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  headerActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
    '@media (max-width: 400px)': {
      width: '100%',
      '& > *': {
        flex: '1 1 auto',
        minWidth: '120px',
      },
    },
  },
  backButton: {
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
  aiSuggestion: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px',
    padding: tokens.spacingVerticalM,
    backgroundColor: '#f0f7ff',
    borderRadius: '12px',
    border: '1px solid rgba(15, 108, 189, 0.15)',
  },
  aiSuggestionText: {
    fontSize: '14px',
    color: '#1e293b',
    flex: '1 1 auto',
    minWidth: '200px',
  },
  emailHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingBottom: tokens.spacingVerticalM,
  },
  emailSubject: {
    fontSize: '18px',
    fontWeight: '600' as any,
    color: '#1e293b',
    lineHeight: '1.4',
  },
  emailMeta: {
    fontSize: '13px',
    color: '#64748b',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  body: {
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: '16px',
    padding: tokens.spacingHorizontalL,
    background: '#ffffff',
    minHeight: '200px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#1e293b',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    '& pre': {
      whiteSpace: 'pre-wrap',
      margin: 0,
      fontFamily: 'inherit',
      fontSize: '14px',
      lineHeight: '1.6',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      maxWidth: '100%',
    },
    '& *': {
      maxWidth: '100%',
      boxSizing: 'border-box',
    },
    '& img': {
      maxWidth: '100%',
      height: 'auto',
      display: 'block',
      objectFit: 'contain',
    },
    '& table': {
      maxWidth: '100%',
      width: '100%',
      tableLayout: 'fixed',
      borderCollapse: 'collapse',
      overflow: 'hidden',
      '& td, & th': {
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        padding: '4px 8px',
      },
    },
    '& iframe, & embed, & object, & video': {
      maxWidth: '100%',
      height: 'auto',
      display: 'block',
    },
    '& a': {
      wordBreak: 'break-all',
      overflowWrap: 'break-word',
    },
    '& div, & p, & span, & td, & th': {
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      maxWidth: '100%',
    },
    '& blockquote': {
      maxWidth: '100%',
      overflow: 'hidden',
      wordBreak: 'break-word',
    },
  },
  noMatch: {
    padding: tokens.spacingVerticalM,
    backgroundColor: '#fef2f2',
    borderRadius: '10px',
    border: '1px solid #fecaca',
    fontSize: '13px',
    color: '#991b1b',
  },
  dropdown: {
    minWidth: '140px',
    '@media (max-width: 400px)': {
      minWidth: '100%',
    },
  },
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
  const [predictionAttempted, setPredictionAttempted] = useState(false)
  const isHtml = useMemo(() => /<\w+/.test(email.body), [email.body])
  const safeHtml = useMemo(() => {
    if (!isHtml) return ''
    // Sanitize HTML and add inline styles to constrain content
    const sanitized = DOMPurify.sanitize(email.body, {
      ADD_ATTR: ['style'],
      ALLOW_DATA_ATTR: false,
    })
    // Wrap in a container div with constraints
    return `<div style="max-width: 100%; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${sanitized}</div>`
  }, [email.body, isHtml])

  // Inject global styles for email content after mount
  useEffect(() => {
    if (!isHtml) return
    
    const styleId = 'email-detail-constraints'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .email-body-content * {
        max-width: 100% !important;
        box-sizing: border-box !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
      }
      .email-body-content img {
        max-width: 100% !important;
        height: auto !important;
        display: block !important;
      }
      .email-body-content table {
        max-width: 100% !important;
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
      }
      .email-body-content iframe,
      .email-body-content embed,
      .email-body-content object,
      .email-body-content video {
        max-width: 100% !important;
        height: auto !important;
      }
      .email-body-content a {
        word-break: break-all !important;
        overflow-wrap: break-word !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [isHtml])

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
      setPredictionAttempted(true)
      const top = preds?.[0]
      if (top) {
        setSelectedCategoryId(top.categoryId)
        // low/high confidence UI is gated by backend threshold; UI treats low confidence as suggestion
        // We don't know the threshold from frontend; expose as informational only
        setLowConfidence(false)
      } else {
        // Clear any previously selected suggestion if no confident match is returned
        setSelectedCategoryId(undefined)
      }
    } finally { setBusy(false) }
  }

  const sendFeedbackAndToast = async (targetCategoryId: string) => {
    setBusy(true)
    try {
      const resp: any = await emailService.feedback(email.id, targetCategoryId, true)
      const moved = resp?.data?.moveResult?.moved === true
      const alreadyIn = resp?.data?.moveResult?.reason === 'already-in-destination'
      const categoryName = categories.find(c => c.id === targetCategoryId)?.name || 'Category'
      onUpdated({ categoryId: targetCategoryId, isProcessed: moved ? true : undefined })
      if (moved) {
        notifySuccess('Learning applied', `Message moved to ${categoryName}.`)
      } else if (alreadyIn) {
        notifyInfo('Already in destination', `Already in ${categoryName}.`)
      } else {
        const hasFolder = !!categories.find(c => c.id === targetCategoryId)?.outlookFolderId
        if (!hasFolder) {
          notifyInfo('Learning applied only', 'Category has no Outlook folder; learning applied only.')
        } else {
          notifySuccess('Learning applied', `Category updated to ${categoryName}.`)
        }
      }
    } catch (e: any) {
      notifyError('Feedback failed', e?.message || 'Unable to apply feedback')
    } finally {
      setBusy(false)
    }
  }

  const move = async () => {
    if (!moveTarget) return
    await sendFeedbackAndToast(moveTarget)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button size="small" onClick={onBack} className={styles.backButton} appearance="secondary">← Back</Button>
        <div className={styles.headerActions}>
          <Button size="small" onClick={markRead} disabled={busy || email.isProcessed} className={styles.secondaryButton} appearance="secondary">
            Mark as read
          </Button>
          {AI_ENABLE && (
            <Button size="small" onClick={predict} disabled={busy} className={styles.secondaryButton} appearance="secondary">
              AI Categorize
            </Button>
          )}
          <Dropdown 
            value={moveTarget} 
            onOptionSelect={(_, d) => setMoveTarget(d.optionValue as string)} 
            placeholder="Move to..." 
            className={styles.dropdown}
            size="small"
            appearance="outline"
          >
            {categories.map(c => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Dropdown>
          <Button size="small" onClick={move} disabled={busy || !moveTarget} className={styles.primaryButton} appearance="primary">
            Move
          </Button>
          {busy && <Spinner size="tiny" />}
        </div>
      </div>

      {AI_ENABLE && predictions.length > 0 && (
        <div className={styles.aiSuggestion}>
          <Text className={styles.aiSuggestionText}>
            <strong>Suggested:</strong> {categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId} 
            {' '}({(predictions[0].confidence * 100).toFixed(0)}% confidence)
            {lowConfidence && (
              <Tooltip content="Low confidence prediction. Please confirm or choose a category." relationship="label">
                <span style={{ color: tokens.colorPaletteRedForeground3, marginLeft: '8px' }}>(low confidence)</span>
              </Tooltip>
            )}
          </Text>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button 
              appearance="primary" 
              size="small"
              className={styles.primaryButton}
              onClick={async () => {
                if (!selectedCategoryId) return
                await sendFeedbackAndToast(selectedCategoryId)
              }}
            >
              Apply
            </Button>
            <Dropdown 
              value={selectedCategoryId}
              onOptionSelect={(_, d) => setSelectedCategoryId(d.optionValue as string)}
              placeholder="Choose category"
              className={styles.dropdown}
              size="small"
              appearance="outline"
            >
              {categories.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Dropdown>
          </div>
        </div>
      )}

      {AI_ENABLE && predictionAttempted && predictions.length === 0 && (
        <div className={styles.noMatch}>
          <Text>No confident match found. Please select a category manually.</Text>
        </div>
      )}

      <div className={styles.emailHeader}>
        <Text className={styles.emailSubject}>{email.subject || '(No subject)'}</Text>
        <div className={styles.emailMeta}>
          <span><strong>From:</strong> {email.sender}</span>
          <span>•</span>
          <span>{email.receivedDate.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.body} style={{ overflowX: 'hidden', overflowY: 'visible' }}>
        {isHtml ? (
          <div 
            className="email-body-content"
            dangerouslySetInnerHTML={{ __html: safeHtml }} 
            style={{ 
              maxWidth: '100%', 
              overflow: 'hidden',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              boxSizing: 'border-box',
            }} 
          />
        ) : (
          <pre style={{ maxWidth: '100%', overflow: 'hidden', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{email.body}</pre>
        )}
      </div>
    </div>
  )
}

export default EmailDetail



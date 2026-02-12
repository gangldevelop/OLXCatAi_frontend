import React, { useState } from 'react'
import { Button, Text, makeStyles, tokens, Spinner, shorthands } from '@fluentui/react-components'
import { ensureTokens } from '../lib/outlookAuth'
import { MailInboxRegular, ShieldCheckmarkRegular, SparkleRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalXL,
    backgroundColor: '#f8fafc',
    backgroundImage:
      'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(56, 113, 220, 0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '28px',
    padding: '40px 36px',
    borderRadius: '20px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0,0,0,0.04)',
    animationName: {
      from: { opacity: 0, transform: 'translateY(16px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    animationDuration: '0.5s',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    animationFillMode: 'both',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0f6cbd 0%, #3b82f6 100%)',
    color: '#ffffff',
    fontSize: '22px',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.4',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f1f5f9',
    width: '100%',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  featureRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  featureIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#f0f7ff',
    color: '#0f6cbd',
    fontSize: '16px',
    flexShrink: 0,
  },
  featureText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  featureTitle: {
    fontSize: '13px',
    fontWeight: '600' as any,
    color: '#1e293b',
    lineHeight: '1.3',
  },
  featureDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
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
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  primaryButton: {
    width: '100%',
    height: '48px',
    borderRadius: '12px !important',
    fontSize: '15px',
    fontWeight: '600' as any,
    background: 'linear-gradient(135deg, #0f6cbd 0%, #2563eb 100%) !important',
    border: 'none !important',
    boxShadow: '0 2px 8px rgba(15, 108, 189, 0.3)',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 16px rgba(15, 108, 189, 0.4)',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  helper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#94a3b8',
    textAlign: 'center' as const,
  },
  shieldIcon: {
    fontSize: '13px',
    color: '#22c55e',
  },
})

type Props = {
  onSignedIn: () => void
}

const SignInGate: React.FC<Props> = ({ onSignedIn }) => {
  const styles = useStyles()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await ensureTokens()
      onSignedIn()
    } catch (e: any) {
      setError(e?.message || 'Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Logo + Title */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <MailInboxRegular />
          </div>
          <div className={styles.header}>
            <Text className={styles.title}>OLXCatAI</Text>
            <Text className={styles.subtitle}>Smart email categorization for Outlook</Text>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Feature highlights */}
        <div className={styles.features}>
          <div className={styles.featureRow}>
            <div className={styles.featureIcon}>
              <SparkleRegular />
            </div>
            <div className={styles.featureText}>
              <Text className={styles.featureTitle}>AI-powered categorization</Text>
              <Text className={styles.featureDesc}>
                Automatically categorize emails into predefined categories.
              </Text>
            </div>
          </div>
          <div className={styles.featureRow}>
            <div className={styles.featureIcon}>
              <MailInboxRegular />
            </div>
            <div className={styles.featureText}>
              <Text className={styles.featureTitle}>Works inside Outlook</Text>
              <Text className={styles.featureDesc}>
                No context switching - everything runs right in your inbox.
              </Text>
            </div>
          </div>
          <div className={styles.featureRow}>
            <div className={styles.featureIcon}>
              <ShieldCheckmarkRegular />
            </div>
            <div className={styles.featureText}>
              <Text className={styles.featureTitle}>Secure by design</Text>
              <Text className={styles.featureDesc}>
                MSAL authentication only. We never store your password.
              </Text>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Text className={styles.error} role="alert">
            {error}
          </Text>
        )}

        {/* CTA */}
        <div className={styles.actions}>
          <Button
            appearance="primary"
            size="large"
            className={styles.primaryButton}
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="tiny" />
                <span style={{ marginLeft: 8 }}>Signing you in…</span>
              </>
            ) : (
              'Sign in with Microsoft'
            )}
          </Button>

          <div className={styles.helper}>
            <ShieldCheckmarkRegular className={styles.shieldIcon} />
            <span>Secured with Microsoft identity platform</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignInGate
import React, { useState } from 'react'
import { Button, Text, makeStyles, tokens, Spinner } from '@fluentui/react-components'
import { ensureTokens } from '../lib/outlookAuth'

const useStyles = makeStyles({
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalM,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    maxWidth: '320px',
    width: '100%',
    textAlign: 'center',
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
      setError(e?.message || 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Text weight="semibold">Sign in to continue</Text>
        {error && <Text color="danger">{error}</Text>}
        {loading ? <Spinner size="medium" /> : <Button appearance="primary" onClick={handleSignIn}>Sign In</Button>}
      </div>
    </div>
  )
}

export default SignInGate


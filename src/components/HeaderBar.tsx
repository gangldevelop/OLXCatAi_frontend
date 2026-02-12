import React from 'react'
import { makeStyles, tokens, Text, Button, Badge } from '@fluentui/react-components'
import { AuthStore } from '../stores/auth'
import { signOut } from '../lib/outlookAuth'

const useStyles = makeStyles({
  header: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
})

type Props = {
  health?: 'ok' | 'warn' | 'down'
}

const HeaderBar: React.FC<Props> = ({ health }) => {
  const styles = useStyles()
  const [auth, setAuth] = React.useState(AuthStore.getState())
  React.useEffect(() => AuthStore.subscribe(setAuth), [])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleSwitchAccount = async () => {
    await signOut({ promptSelectAccount: true })
  }

  return (
    <div className={styles.header}>
      <div className={styles.content}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text weight="semibold">OLXCatAI</Text>
          <Badge appearance="filled" color={health === 'ok' ? 'success' : health === 'warn' ? 'warning' : 'danger'} size="small">
            {health || 'unknown'}
          </Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {auth.user ? (
            <>
              <Text size={200}>{auth.user.name} • {auth.user.email}</Text>
              <Button size="small" onClick={handleSwitchAccount}>Switch account</Button>
              <Button size="small" onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <Text size={200}>{auth.jwt || auth.graphToken ? 'Signing in…' : 'Not signed in'}</Text>
          )}
        </div>
      </div>
    </div>
  )
}

export default HeaderBar


import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme} from '@fluentui/react-components';
import './index.css';
import App from './App';
import SignInGate from './components/SignInGate';
import { AuthStore } from './stores/auth';
import GlobalToaster from './components/Toaster';
import { testOfficeIntegration, simulateOfficeContext } from './utils/officeTest';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Handle backend OAuth redirect in a normal browser.
// Backend redirects to: /auth/callback#token=...&graphToken=... (hash params)
// If this is a popup (opened by SignInGate), we also postMessage back and close.
(() => {
  try {
    if (typeof window === 'undefined') return
    const p = window.location.pathname || '/'
    const isAuthCallback = p === '/auth/callback' || p === '/auth/callback/'
    if (!isAuthCallback) return

    const hash = window.location.hash ? window.location.hash.substring(1) : ''
    const search = window.location.search ? window.location.search.substring(1) : ''
    const hp = new URLSearchParams(hash)
    const qp = new URLSearchParams(search)
    const token = hp.get('token') || qp.get('token')
    const graphToken = hp.get('graphToken') || qp.get('graphToken')
    const userRaw = hp.get('user') || qp.get('user')
    let user: any = null
    try {
      user = userRaw ? JSON.parse(decodeURIComponent(userRaw)) : null
    } catch {
      try { user = userRaw ? JSON.parse(userRaw) : null } catch {}
    }

    const payload = token
      ? { success: true, token, graphToken: graphToken ?? null, user: user ?? null }
      : { success: false }

    // Persist tokens for this window (useful when redirect happens in the main tab).
    if (payload.success) {
      AuthStore.setAll({ jwt: payload.token, graphToken: payload.graphToken, user: payload.user })
    }

    // If this is a popup opened by the app, notify the opener and close.
    // `openDialog()` listens for either localStorage changes or postMessage.
    try { localStorage.setItem('olxcat_auth_result', JSON.stringify(payload)) } catch {}
    try { if (window.opener) window.opener.postMessage(JSON.stringify(payload), '*') } catch {}
    try { if (window.opener) window.close() } catch {}

    // Remove tokens from the address bar
    window.history.replaceState({}, document.title, '/')
  } catch {
    // If anything fails, fall through to normal render (SignInGate will show)
  }
})()

// Initialize Office.js testing
if (process.env.NODE_ENV === 'development') {
  // Simulate Office context in development if not available
  simulateOfficeContext();
  
  // Test Office integration after a short delay
  setTimeout(() => {
    testOfficeIntegration();
  }, 1000);
}

const Root: React.FC = () => {
  const [authed, setAuthed] = React.useState(!!AuthStore.getState().jwt)

  React.useEffect(() => {
    const unsub = AuthStore.subscribe(s => setAuthed(!!s.jwt))
    return unsub
  }, [])

  return (
    <FluentProvider theme={webLightTheme} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GlobalToaster />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {authed ? <App /> : <SignInGate onSignedIn={() => setAuthed(true)} />}
      </div>
    </FluentProvider>
  )
}

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// optional for dark mode later on - "webDarkTheme" 
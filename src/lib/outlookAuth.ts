import { http } from './http'
import { APP_ORIGIN } from '../config/env'
import { AuthStore, AuthUser } from '../stores/auth'

type CallbackResult = {
  success: boolean
  token: string
  graphToken: string
  user: AuthUser
}

const openDialog = (url: string): Promise<CallbackResult> => {
  return new Promise((resolve, reject) => {
    let resolved = false
    let popup: Window | null = null
    let closeCheck: ReturnType<typeof setInterval> | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'olxcat_auth_result' || !e.newValue) return
      try {
        const payload = JSON.parse(e.newValue)
        localStorage.removeItem('olxcat_auth_result')
        resolved = true
        cleanup()
        resolve(payload)
      } catch {}
    }
    const onMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data && data.success && data.token) {
          resolved = true
          cleanup()
          resolve(data as any)
        }
      } catch {}
    }
    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('storage', onStorage)
      if (closeCheck) clearInterval(closeCheck)
      if (timeout) clearTimeout(timeout)
      try { if (popup && !popup.closed) popup.close() } catch {}
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('message', onMessage)
    // Prefer Office dialog when available so auth stays as an Office modal and auto-closes
    const openOfficeDialog = () => {
      window.Office.context.ui.displayDialogAsync(
        url,
        {
          height: 60,
          width: 40,
          requireHTTPS: true,
          displayInIframe:
            window.Office?.context?.platform === (window.Office as any)?.PlatformType?.OfficeOnline ? true : false,
        },
        (asyncResult: any) => {
          const dialog = asyncResult?.value
          if (!dialog) {
            reject(new Error('Unable to open dialog'))
            return
          }
          let officeDialogResolved = false
          // Safety timeout in case the dialog never posts a message
          const officeTimeout = setTimeout(() => {
            if (!officeDialogResolved) {
              try { dialog.close() } catch {}
              reject(new Error('Login timed out'))
            }
          }, 120000)

          const messageHandler = (arg: any) => {
            try {
              const payload: CallbackResult = JSON.parse(arg.message)
              officeDialogResolved = true
              clearTimeout(officeTimeout)
              try { dialog.close() } catch {}
              resolve(payload)
            } catch {
              officeDialogResolved = true
              clearTimeout(officeTimeout)
              try { dialog.close() } catch {}
              reject(new Error('Invalid auth response'))
            }
          }
          const eventHandler = (arg: any) => {
            // Dialog closed by user or host without a message
            if (!officeDialogResolved) {
              clearTimeout(officeTimeout)
              reject(new Error('Login window closed'))
            }
          }
          dialog.addEventHandler(window.Office.EventType.DialogMessageReceived, messageHandler)
          if (window.Office.EventType.DialogEventReceived) {
            dialog.addEventHandler(window.Office.EventType.DialogEventReceived, eventHandler)
          }
        }
      )
    }

    if (window.Office && typeof window.Office.onReady === 'function') {
      window.Office.onReady(() => openOfficeDialog())
      return
    }
    if (window.Office?.context?.ui?.displayDialogAsync) {
      openOfficeDialog()
      return
    }

    // Fallback to a real popup if Office dialog API isn't available
    popup = window.open(url, 'olxcat_auth', 'width=600,height=700')
    if (!popup) {
      reject(new Error('Unable to open login window'))
      return
    }
    closeCheck = setInterval(() => {
      if (!popup) return
      if (popup.closed && !resolved) {
        cleanup()
        reject(new Error('Login window closed'))
      }
    }, 500)
    timeout = setTimeout(() => {
      if (!resolved) {
        cleanup()
        reject(new Error('Login timed out'))
      }
    }, 120000)
  })
}

export const ensureTokens = async () => {
  const { jwt, graphToken } = AuthStore.getState()
  if (jwt && graphToken) return AuthStore.getState()

  let ssoGraph: string | null = null
  try {
    if (window.OfficeRuntime?.auth?.getAccessToken) {
      ssoGraph = await window.OfficeRuntime.auth.getAccessToken({ allowSignInPrompt: true })
      if (ssoGraph) AuthStore.setGraphToken(ssoGraph)
    }
  } catch {}

  if (!AuthStore.getState().jwt) {
    const { data } = await http.get<{ authUrl: string }>('/auth/login', { omitGraphToken: true } as any)
    const redirectUrl = new URL(data.authUrl)
    // Respect backend-provided redirect_uri (it must match Azure AD). If missing, default to our public origin.
    if (!redirectUrl.searchParams.get('redirect_uri')) {
      redirectUrl.searchParams.set('redirect_uri', `${APP_ORIGIN}/auth-callback.html`)
    }
    const result = await openDialog(redirectUrl.toString())
    if (!result?.success || !result?.token) throw new Error('Authentication failed')
    AuthStore.setAll({ jwt: result.token, graphToken: result.graphToken ?? null, user: result.user ?? null })
  }

  return AuthStore.getState()
}

export const signOut = async () => {
  try {
    await http.post('/auth/logout')
  } finally {
    AuthStore.clear()
    sessionStorage.clear()
  }
}

// Acquire a fresh delegated Microsoft Graph token and store it
export const acquireFreshGraphToken = async (): Promise<string | null> => {
  try {
    if (window.OfficeRuntime?.auth?.getAccessToken) {
      const token = await window.OfficeRuntime.auth.getAccessToken({ allowSignInPrompt: true })
      if (token) {
        AuthStore.setGraphToken(token)
        return token
      }
    }
  } catch (error) {
    console.error('Failed to acquire fresh Graph token:', error)
  }
  return null
}

// Ensure a fresh token before calling Graph-touching endpoints
export const ensureFreshGraphToken = async (): Promise<string | null> => {
  // Always try to acquire a new token (per product guidance)
  const token = await acquireFreshGraphToken()
  return token
}


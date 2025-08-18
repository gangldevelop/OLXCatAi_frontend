import { http } from './http'
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
        const payload: CallbackResult = JSON.parse(e.newValue)
        localStorage.removeItem('olxcat_auth_result')
        resolved = true
        cleanup()
        resolve(payload)
      } catch {}
    }
    const onMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data && data.success && data.token && data.graphToken && data.user) {
          resolved = true
          cleanup()
          resolve(data as CallbackResult)
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
    if (window.Office?.context?.ui?.displayDialogAsync) {
      window.Office.context.ui.displayDialogAsync(
        url,
        { height: 50, width: 50, displayInIframe: true },
        (result: any) => {
          const dialog = result.value
          if (!dialog) {
            reject(new Error('Unable to open dialog'))
            return
          }
          const handler = (arg: any) => {
            try {
              const payload: CallbackResult = JSON.parse(arg.message)
              dialog.close()
              resolve(payload)
            } catch {
              dialog.close()
              reject(new Error('Invalid auth response'))
            }
          }
          dialog.addEventHandler(window.Office.EventType.DialogMessageReceived, handler)
        }
      )
      return
    }

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
    if (!redirectUrl.searchParams.get('redirect_uri')) {
      redirectUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth-callback.html`)
    }
    const result = await openDialog(redirectUrl.toString())
    if (!result?.success) throw new Error('Authentication failed')
    AuthStore.setAll({ jwt: result.token, graphToken: result.graphToken, user: result.user })
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


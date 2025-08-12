export type AuthUser = {
  id: string
  email: string
  name: string
}

export type AuthState = {
  jwt: string | null
  graphToken: string | null
  user: AuthUser | null
}

type AuthSubscribers = Array<(state: AuthState) => void>

const STORAGE_KEY = 'olxcat_auth_state'

const readFromSession = (): AuthState => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { jwt: null, graphToken: null, user: null }
    const parsed = JSON.parse(raw)
    return {
      jwt: parsed.jwt ?? null,
      graphToken: parsed.graphToken ?? null,
      user: parsed.user ?? null,
    }
  } catch {
    return { jwt: null, graphToken: null, user: null }
  }
}

const writeToSession = (state: AuthState) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

class AuthStoreImpl {
  private state: AuthState
  private subscribers: AuthSubscribers

  constructor() {
    this.state = readFromSession()
    this.subscribers = []
  }

  getState(): AuthState {
    return this.state
  }

  setJwt(jwt: string | null) {
    this.state = { ...this.state, jwt }
    writeToSession(this.state)
    this.notify()
  }

  setGraphToken(graphToken: string | null) {
    this.state = { ...this.state, graphToken }
    writeToSession(this.state)
    this.notify()
  }

  setUser(user: AuthUser | null) {
    this.state = { ...this.state, user }
    writeToSession(this.state)
    this.notify()
  }

  setAll(next: Partial<AuthState>) {
    this.state = { ...this.state, ...next }
    writeToSession(this.state)
    this.notify()
  }

  clear() {
    this.state = { jwt: null, graphToken: null, user: null }
    writeToSession(this.state)
    this.notify()
  }

  subscribe(listener: (state: AuthState) => void) {
    this.subscribers.push(listener)
    return () => {
      this.subscribers = this.subscribers.filter(l => l !== listener)
    }
  }

  private notify() {
    for (const s of this.subscribers) s(this.state)
  }

  hasTokens() {
    return !!this.state.jwt && !!this.state.graphToken
  }
}

export const AuthStore = new AuthStoreImpl()


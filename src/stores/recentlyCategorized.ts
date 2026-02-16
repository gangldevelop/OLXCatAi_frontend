import { changeService, ChangeItem } from '../services/changeService'

type Listener = () => void

class RecentlyCategorizedStore {
  private emailIdToTimestampMs: Map<string, number> = new Map()
  private listeners: Set<Listener> = new Set()

  constructor() {
    // Subscribe to change feed to track individual moves
    changeService.subscribe((items: ChangeItem[]) => {
      for (const item of items) {
        if (item?.type === 'email:moved' && (item as any).messageId) {
          const ts = (item as any).ts as number | undefined
          const messageId = (item as any).messageId as string
          this.mark([messageId], ts || Date.now())
        }
      }
    })
  }

  onChange(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit() {
    this.listeners.forEach(l => {
      try { l() } catch {}
    })
  }

  mark(ids: string[], timestampMs?: number) {
    const ts = typeof timestampMs === 'number' ? timestampMs : Date.now()
    for (const id of ids) {
      this.emailIdToTimestampMs.set(id, ts)
    }
    this.emit()
  }

  getTimestampMs(emailId: string): number | undefined {
    return this.emailIdToTimestampMs.get(emailId)
  }
}

export const recentlyCategorizedStore = new RecentlyCategorizedStore()



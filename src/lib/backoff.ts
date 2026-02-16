export type BackoffOptions = {
  initialDelayMs?: number
  maxDelayMs?: number
  jitterRatio?: number
  retryOn429?: boolean
  retryOn503?: boolean
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withBackoff<T>(fn: () => Promise<T>, options?: BackoffOptions): Promise<T> {
  const initial = options?.initialDelayMs ?? 1000
  const max = options?.maxDelayMs ?? 15000
  const jitterRatio = options?.jitterRatio ?? 0.2
  const retryOn429 = options?.retryOn429 ?? false
  const retryOn503 = options?.retryOn503 ?? true
  let delay = 0
  // Keep retrying (configurable) with exponential backoff up to max
  // Stops on first success or non-retryable error
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (err: any) {
      const status = err?.response?.status
      const headers = err?.response?.headers || {}
      // Respect Retry-After header when retrying
      const retryAfterHeader: string | undefined = headers['retry-after'] || headers['Retry-After']

      const computeRetryAfterMs = (): number | undefined => {
        if (!retryAfterHeader) return undefined
        const seconds = Number(retryAfterHeader)
        if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000)
        const date = new Date(retryAfterHeader)
        const ms = date.getTime() - Date.now()
        return Number.isFinite(ms) ? Math.max(0, ms) : undefined
      }

      if ((status === 429 && retryOn429) || (status === 503 && retryOn503)) {
        const retryAfterMs = computeRetryAfterMs()
        if (typeof retryAfterMs === 'number') {
          await sleep(retryAfterMs)
          continue
        }
        delay = delay === 0 ? initial : Math.min(delay * 2, max)
        const jitter = delay * jitterRatio * (Math.random() * 2 - 1)
        await sleep(Math.max(0, Math.round(delay + jitter)))
        continue
      }
      throw err
    }
  }
}



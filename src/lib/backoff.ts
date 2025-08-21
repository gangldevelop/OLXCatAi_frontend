export type BackoffOptions = {
  initialDelayMs?: number
  maxDelayMs?: number
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withBackoff<T>(fn: () => Promise<T>, options?: BackoffOptions): Promise<T> {
  const initial = options?.initialDelayMs ?? 1000
  const max = options?.maxDelayMs ?? 15000
  let delay = 0
  // Keep retrying on 429/503 with exponential backoff up to max
  // Stops on first success or non-retryable error
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 429 || status === 503) {
        delay = delay === 0 ? initial : Math.min(delay * 2, max)
        await sleep(delay)
        continue
      }
      throw err
    }
  }
}



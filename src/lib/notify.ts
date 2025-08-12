export type NoticeType = 'success' | 'error' | 'info' | 'warning'

export type Notice = {
  type: NoticeType
  title: string
  body?: string
}

type Listener = (n: Notice) => void

const listeners: Listener[] = []

export const notify = (n: Notice) => {
  for (const l of listeners) l(n)
}

export const onNotify = (l: Listener) => {
  listeners.push(l)
  return () => {
    const i = listeners.indexOf(l)
    if (i >= 0) listeners.splice(i, 1)
  }
}

export const notifySuccess = (title: string, body?: string) => notify({ type: 'success', title, body })
export const notifyError = (title: string, body?: string) => notify({ type: 'error', title, body })
export const notifyInfo = (title: string, body?: string) => notify({ type: 'info', title, body })
export const notifyWarning = (title: string, body?: string) => notify({ type: 'warning', title, body })



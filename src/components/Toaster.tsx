import React, { useEffect } from 'react'
import { Toast, ToastBody, ToastTitle, Toaster, useId, useToastController } from '@fluentui/react-components'
import { Notice, onNotify } from '../lib/notify'

const GlobalToaster: React.FC = () => {
  const toasterId = useId('toaster')
  const { dispatchToast } = useToastController(toasterId)

  useEffect(() => {
    const unsub = onNotify((n: Notice) => {
      dispatchToast(
        <Toast>
          <ToastTitle>{n.title}</ToastTitle>
          {n.body && <ToastBody>{n.body}</ToastBody>}
        </Toast>,
        { intent: n.type === 'error' ? 'error' : n.type === 'success' ? 'success' : n.type === 'warning' ? 'warning' : 'info' }
      )
    })
    return unsub
  }, [dispatchToast, toasterId])

  return <Toaster toasterId={toasterId} />
}

export default GlobalToaster



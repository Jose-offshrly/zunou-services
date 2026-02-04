import { createContext, useCallback, useContext, useState } from 'react'

import { Snackbar } from '../components/utility/Snackbar'

interface SnackbarProps {
  alertError: (msg: string) => void
  alertInfo: (msg: string) => void
  alertSuccess: (msg: string) => void
  alertWarning: (msg: string) => void
}

const Context = createContext<SnackbarProps>({
  alertError: (_msg: string) => undefined,
  alertInfo: (_msg: string) => undefined,
  alertSuccess: (_msg: string) => undefined,
  alertWarning: (_msg: string) => undefined,
})

export const useSnackbarContext = (): SnackbarProps => useContext(Context)

export const SnackbarContext = ({
  children,
}: React.PropsWithChildren<Record<string, unknown>>): React.ReactElement => {
  const [message, setMessage] = useState<string | undefined>()
  const [severity, setSeverity] = useState<
    'error' | 'info' | 'success' | 'warning' | undefined
  >()

  const alertError = useCallback((msg: string) => {
    setSeverity('error')
    setMessage(msg)
  }, [])

  const alertInfo = useCallback((msg: string) => {
    setSeverity('info')
    setMessage(msg)
  }, [])

  const alertSuccess = useCallback((msg: string) => {
    setSeverity('success')
    setMessage(msg)
  }, [])

  const alertWarning = useCallback((msg: string) => {
    setSeverity('warning')
    setMessage(msg)
  }, [])

  const value = { alertError, alertInfo, alertSuccess, alertWarning }

  return (
    <Context.Provider value={value}>
      {children}

      {message ? (
        <Snackbar
          message={message}
          onClose={() => setMessage(undefined)}
          severity={severity}
        />
      ) : null}
    </Context.Provider>
  )
}

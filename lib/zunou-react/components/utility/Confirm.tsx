import { Dialog, DialogActions, DialogContent } from '@mui/material'
import { ReactElement, useCallback, useState } from 'react'

import { Button } from '../form/Button'
import { LoadingButton } from '../form/LoadingButton'
import { Paragraph } from '../typography/Paragraph'

interface Props {
  action: () => void
  actionLabel: string
  children: (launch: () => void) => ReactElement
  intent?: 'danger' | 'success'
  loading?: boolean
  message: string
}

export const Confirm = ({
  action,
  actionLabel,
  children,
  intent,
  loading,
  message,
}: Props) => {
  const [visible, setVisible] = useState(false)

  const hideDialog = useCallback(() => setVisible(false), [])

  const showDialog = useCallback(() => setVisible(true), [])

  const onClick = useCallback(() => {
    action()
    hideDialog()
  }, [action, hideDialog])

  return (
    <>
      {children(showDialog)}

      <Dialog maxWidth="xs" open={visible}>
        <DialogContent>
          <Paragraph>{message}</Paragraph>
        </DialogContent>
        <DialogActions>
          <Button autoFocus={true} disabled={loading} onClick={hideDialog}>
            Cancel
          </Button>
          <LoadingButton
            color={intent === 'danger' ? 'error' : 'primary'}
            loading={loading}
            onClick={onClick}
          >
            {actionLabel}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

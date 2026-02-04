import { Box } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { Breakpoint, SxProps } from '@mui/system'
import type { FormEventHandler, PropsWithChildren } from 'react'

import { MutationError } from '../../types/graphql'
import { ErrorHandler } from '../utility/ErrorHandler'

interface Props {
  disableEnterSubmit?: boolean
  error?: MutationError
  maxWidth?: Breakpoint | false
  noPadding?: boolean
  onSubmit?: FormEventHandler<HTMLFormElement>
  sx?: SxProps<Theme>
}

export const Form = ({
  children,
  disableEnterSubmit,
  error,
  maxWidth = 'sm',
  noPadding = false,
  onSubmit,
  sx,
}: PropsWithChildren<Props>) => (
  <ErrorHandler error={error}>
    <Box
      component="form"
      display="flex"
      flexDirection="column"
      onKeyPress={(event) => {
        disableEnterSubmit && event.key === 'Enter' && event.preventDefault()
      }}
      onSubmit={onSubmit}
      sx={{
        maxWidth: maxWidth || undefined,
        padding: noPadding ? 0 : { md: 3, xs: 0 },
        ...sx,
      }}
    >
      {children}
    </Box>
  </ErrorHandler>
)

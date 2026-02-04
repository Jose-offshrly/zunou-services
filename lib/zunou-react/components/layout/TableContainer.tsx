import type { PaperTypeMap } from '@mui/material'
import {
  Paper,
  TableContainer as BaseTableContainer,
  TableContainerProps,
} from '@mui/material'
import type { OverridableComponent } from '@mui/types'
import type { PropsWithChildren } from 'react'

interface Props {
  component?: OverridableComponent<PaperTypeMap<Record<string, never>>>
}

export const TableContainer = ({
  children,
  ...props
}: PropsWithChildren<Props & TableContainerProps>) => (
  <BaseTableContainer component={Paper} {...props}>
    {children}
  </BaseTableContainer>
)

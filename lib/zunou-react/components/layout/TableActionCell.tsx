import { TableCellProps } from '@mui/material'
import type { PropsWithChildren } from 'react'

import { TableCell } from './TableCell'

export const TableActionCell = ({
  align,
  children,
  ...sx
}: PropsWithChildren<TableCellProps>) => (
  <TableCell
    align={align}
    sx={{
      padding: 0,
      width: 56,
      ...sx,
    }}
  >
    {children}
  </TableCell>
)

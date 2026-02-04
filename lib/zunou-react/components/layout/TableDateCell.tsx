import { TableCellProps } from '@mui/material'
import type { PropsWithChildren } from 'react'

import { TableCell } from './TableCell'

export const TableDateCell = ({
  children,
  ...props
}: PropsWithChildren<TableCellProps>) => (
  <TableCell
    sx={{
      width: 180,
      ...props,
    }}
  >
    {children}
  </TableCell>
)

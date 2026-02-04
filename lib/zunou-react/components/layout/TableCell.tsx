import { styled } from '@mui/material/styles'
import BaseTableCell, {
  tableCellClasses,
  TableCellProps,
} from '@mui/material/TableCell'
import type { PropsWithChildren } from 'react'

const StyledTableCell = styled(BaseTableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 'bold',
  },
}))

export const TableCell = ({
  children,
  ...props
}: PropsWithChildren<TableCellProps>) => {
  return <StyledTableCell {...props}>{children}</StyledTableCell>
}

import { styled } from '@mui/material/styles'
import BaseTableRow, {
  tableRowClasses,
  TableRowProps,
} from '@mui/material/TableRow'
import type { PropsWithChildren } from 'react'

const StyledTableRow = styled(BaseTableRow)(({ theme }) => ({
  [`&.${tableRowClasses.head}`]: {
    backgroundColor: theme.palette.grey['50'],
  },
}))

export const TableRow = ({
  children,
  ...props
}: PropsWithChildren<TableRowProps>) => {
  return <StyledTableRow {...props}>{children}</StyledTableRow>
}

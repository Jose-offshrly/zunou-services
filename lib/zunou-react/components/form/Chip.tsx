import BaseChip, { ChipProps } from '@mui/material/Chip'
import type { PropsWithChildren } from 'react'

export const Chip = ({ children, ...props }: PropsWithChildren<ChipProps>) => {
  return <BaseChip {...props}>{children}</BaseChip>
}

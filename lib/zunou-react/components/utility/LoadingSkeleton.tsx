import { Skeleton } from '@mui/material'

export const LoadingSkeleton = ({
  height = '100%',
  variant = 'rectangular',
  width = '100%',
}: {
  height?: string | number
  variant?: 'rectangular' | 'circular' | 'text' | 'rounded'
  width?: string | number
}) => {
  return <Skeleton height={height} variant={variant} width={width} />
}

import { Skeleton, SxProps } from '@mui/material'

interface LoadingSkeletonProps {
  height?: string | number
  variant?: 'rectangular' | 'circular' | 'text' | 'rounded'
  width?: string | number
  sx?: SxProps
}

export const LoadingSkeleton = ({
  height = '100%',
  variant = 'rounded',
  width = '100%',
  sx,
}: LoadingSkeletonProps) => {
  return (
    <Skeleton height={height} sx={{ ...sx }} variant={variant} width={width} />
  )
}

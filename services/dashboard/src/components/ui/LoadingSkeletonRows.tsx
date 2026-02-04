import { Stack } from '@mui/material'
import React from 'react'

import { LoadingSkeleton } from './LoadingSkeleton'

interface LoadingSkeletonRowsProps {
  rows?: number
  rowHeight?: string | number
  width?: string | number
  style?: React.CSSProperties
}

export const LoadingSkeletonRows = ({
  rows = 3,
  rowHeight = 24,
  width = '100%',
  style,
}: LoadingSkeletonRowsProps) => {
  return (
    <Stack direction="column" spacing={1} style={style}>
      {Array.from({ length: rows }).map((_, idx) => (
        <LoadingSkeleton height={rowHeight} key={idx} width={width} />
      ))}
    </Stack>
  )
}

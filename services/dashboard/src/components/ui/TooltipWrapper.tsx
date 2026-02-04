import { Box, Tooltip } from '@mui/material'
import React from 'react'

interface TooltipWrapperProps {
  children: React.ReactNode
  hasArrow?: boolean
  title: string
}
export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  children,
  hasArrow = true,
  title,
}) => {
  return (
    <Tooltip
      arrow={hasArrow}
      sx={{
        width: 'fit',
      }}
      title={title}
    >
      <Box component="span">{children}</Box>
    </Tooltip>
  )
}

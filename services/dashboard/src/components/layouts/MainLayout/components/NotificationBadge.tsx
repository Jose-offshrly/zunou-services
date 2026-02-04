import { Badge } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import React from 'react'

const NotificationBadge = ({
  children,
  offset = '18%',
  isInverted = false,
  count = 0,
}: {
  children: React.ReactNode
  offset?: string
  isInverted?: boolean
  count?: number
}) => {
  return (
    <Badge
      badgeContent={count > 0 ? (count > 10 ? '10+' : count) : undefined}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: isInverted ? theme.palette.common.white : '#FE6C5F',
          color: isInverted ? '#FE6C5F' : theme.palette.common.white,
          fontSize: 10,
          fontWeight: 500,
          height: count === 0 ? 8 : 16,
          minWidth: count === 0 ? 8 : 16,
          padding: count > 0 ? '0 4px' : 0,
          right: offset,
          top: offset,
        },
      }}
      variant={count > 0 ? 'standard' : 'dot'}
    >
      {children}
    </Badge>
  )
}

export default NotificationBadge

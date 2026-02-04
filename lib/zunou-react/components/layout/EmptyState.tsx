import { alpha, Typography } from '@mui/material'
import { styled } from '@mui/system'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { ReactNode } from 'react'

const IconWrapper = styled('div')(() => ({
  alignItems: 'center',
  backgroundColor: alpha(theme.palette.text.secondary, 0.05),
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  padding: 12,
}))

interface EmptyStateProps {
  icon: ReactNode
  message: string
  onClick?: () => void
  isDisabled?: boolean
  hasNoAccess?: boolean
}

export const EmptyState = ({
  icon,
  message,
  onClick,
  isDisabled = false,
  hasNoAccess = false,
}: EmptyStateProps) => {
  return (
    <Button
      disabled={isDisabled || hasNoAccess}
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.2),
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%',
        padding: 3,
        textAlign: 'center',
        whiteSpace: 'normal',
        width: '100%',
      }}
    >
      <IconWrapper
        sx={{
          color: theme.palette.text.secondary,
        }}
      >
        {icon}
      </IconWrapper>
      <Typography
        color="text.secondary"
        fontSize={12}
        fontWeight={400}
        sx={{
          mt: 1,
          overflowWrap: 'break-word',
          width: '100%',
          wordBreak: 'break-word',
        }}
        textAlign="center"
      >
        {isDisabled ? 'Coming soon' : message}
      </Typography>
    </Button>
  )
}

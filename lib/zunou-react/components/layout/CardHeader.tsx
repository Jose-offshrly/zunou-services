import { Close, SvgIconComponent } from '@mui/icons-material'
import { Icon, IconButton, Stack } from '@mui/material'
import BaseCardHeader, {
  cardHeaderClasses,
  CardHeaderProps,
} from '@mui/material/CardHeader'
import { alpha, styled } from '@mui/material/styles'
import React from 'react'

export interface ActionButton {
  icon: SvgIconComponent
  onClick: () => void
  ariaLabel?: string
}

interface ExtendedCardHeaderProps extends CardHeaderProps {
  onClose?: () => void
  headerActions?: ActionButton[]
  customHeaderActions?: React.ReactNode
}

const StyledCardHeader = styled(BaseCardHeader)(({ theme }) => ({
  [`& .${cardHeaderClasses.title}`]: {
    color: theme.palette.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    overflowWrap: 'break-word',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  },
  [`& .${cardHeaderClasses.subheader}`]: {
    color: theme.palette.text.secondary,
    fontSize: 14,
    fontWeight: 'light',
  },
  borderBottomColor: theme.palette.divider,
  borderBottomStyle: 'solid',
  borderBottomWidth: 1,
}))

export const CardHeader: React.FC<ExtendedCardHeaderProps> = ({
  children,
  onClose,
  headerActions = [],
  customHeaderActions,
  ...props
}) => {
  return (
    <StyledCardHeader
      {...props}
      action={
        <Stack direction="row" spacing={2}>
          <Stack alignItems="center" direction="row" spacing={1}>
            {customHeaderActions}

            {headerActions.map((action, index) => (
              <IconButton
                aria-label="action.ariaLabel"
                key={index}
                onClick={action.onClick}
                sx={{
                  border: (theme) =>
                    `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  color: 'text.secondary',
                }}
              >
                <Icon component={action.icon} fontSize="small" />
              </IconButton>
            ))}
          </Stack>
          {onClose && (
            <IconButton aria-label="close" onClick={onClose}>
              <Close />
            </IconButton>
          )}
        </Stack>
      }
    >
      {children}
    </StyledCardHeader>
  )
}

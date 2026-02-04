import { Modal } from '@mui/material'
import { Box, SxProps } from '@mui/system'
import {
  ActionButton,
  Card,
  CardContent,
  CardHeader,
} from '@zunou-react/components/layout'
import React from 'react'

interface CustomModalProps {
  children: React.ReactNode
  customHeaderActions?: React.ReactNode
  maxHeight?: number
  minHeight?: number
  headerActions?: ActionButton[]
  isOpen: boolean
  onClose?: () => void
  style?: SxProps
  subheader?: string | React.ReactNode
  title?: string | React.ReactNode
  maxWidth?: number | string
  minWidth?: number
  withPadding?: boolean
}

export const CustomModal = ({
  maxHeight,
  minHeight,
  children,
  customHeaderActions,
  headerActions,
  isOpen,
  onClose,
  style,
  subheader,
  maxWidth = 860,
  minWidth = 520,
  title,
  withPadding = true,
}: CustomModalProps) => {
  return (
    <Modal
      disableAutoFocus={true}
      disableEnforceFocus={true}
      onClose={onClose}
      open={isOpen}
    >
      <Box>
        <Card
          sx={{
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            left: '50%',
            maxHeight: maxHeight ? `${maxHeight}px` : '90vh',
            maxWidth: maxWidth
              ? typeof maxWidth === 'number'
                ? `${maxWidth}px`
                : maxWidth
              : 'none',
            minHeight: minHeight ? `${minHeight}px` : 'auto',
            minWidth,
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '75%',
            ...style,
          }}
        >
          <CardHeader
            customHeaderActions={customHeaderActions}
            headerActions={headerActions}
            onClose={onClose}
            subheader={subheader}
            title={title}
          />
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              minHeight: 0,
              overflow: 'auto',
              padding: withPadding ? 2 : 0,
            }}
          >
            {children}
          </CardContent>
        </Card>
      </Box>
    </Modal>
  )
}

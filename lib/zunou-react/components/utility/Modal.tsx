import { Close } from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import * as React from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footerContent?: React.ReactNode
  headerContent?: React.ReactNode
}

const Modal = ({
  open,
  onClose,
  title,
  children,
  footerContent,
  headerContent,
}: ModalProps) => (
  <Dialog
    PaperProps={{
      sx: {
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        left: '50%',
        maxWidth: 1000,
        outline: 'none',
        position: 'absolute',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
      },
    }}
    fullWidth={true}
    maxWidth="sm"
    onClose={onClose}
    open={open}
  >
    {headerContent && (
      <ModalHeader onClose={onClose} title={title}>
        {headerContent}
      </ModalHeader>
    )}
    <ModalBody>{children}</ModalBody>
    {footerContent && <ModalFooter>{footerContent}</ModalFooter>}
  </Dialog>
)

interface ModalHeaderProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

const ModalHeader = ({ title, onClose, children }: ModalHeaderProps) => (
  <DialogTitle
    sx={{
      alignItems: 'center',
      borderBottom: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      justifyContent: 'space-between',
    }}
  >
    <Typography component="span" fontSize={20} fontWeight={600} variant="h6">
      {title}
    </Typography>
    {children}
    <Button
      onClick={onClose}
      sx={{ color: 'text.secondary', minWidth: 0, padding: 0 }}
    >
      <Close sx={{ fontSize: 24 }} />
    </Button>
  </DialogTitle>
)

interface ModalBodyProps {
  children: React.ReactNode
}

const ModalBody = ({ children }: ModalBodyProps) => (
  <DialogContent
    sx={{
      color: 'text.primary',
      fontSize: '1rem',
      padding: '12px',
    }}
  >
    {children}
  </DialogContent>
)

interface ModalFooterProps {
  children: React.ReactNode
}

const ModalFooter = ({ children }: ModalFooterProps) => (
  <DialogActions
    sx={{
      borderColor: 'divider',
      borderTop: '1px solid',
      display: 'flex',
      justifyContent: 'flex-end',
      padding: '8px 16px',
    }}
  >
    {children}
  </DialogActions>
)

export { Modal, ModalBody, ModalFooter, ModalHeader }

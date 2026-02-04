import { KeyboardReturnOutlined } from '@mui/icons-material'
import { Modal, Stack, Typography } from '@mui/material'
import { Box, SxProps } from '@mui/system'
import { Button, Form, LoadingButton } from '@zunou-react/components/form'
import {
  ActionButton,
  Card,
  CardActions,
  CardContent,
  CardHeader,
} from '@zunou-react/components/layout'
import React from 'react'
import { useTranslation } from 'react-i18next'

import i18n from '../../i18n'

interface CustomModalWithSubmitProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  customHeaderActions?: React.ReactNode
  disabledSubmit?: boolean
  footerText?: string | React.ReactNode
  headerActions?: ActionButton[]
  headerContent?: React.ReactNode
  isEditable?: boolean
  isSubmitting?: boolean
  maxHeight?: number | string
  maxWidth?: number
  minHeight?: number
  onCancel?: () => void
  style?: SxProps
  subheader?: string | React.ReactNode
  submitText?: string
  title?: string | React.ReactNode
  type?: 'default' | 'warning'

  submitOnEnter?: boolean
}

export const CustomModalWithSubmit = ({
  children,
  isOpen,
  onClose,
  onSubmit,
  customHeaderActions,
  disabledSubmit = false,
  footerText,
  headerActions,
  headerContent,
  isEditable = true,
  isSubmitting,
  maxHeight = 'fit-content',
  maxWidth = 640,
  minHeight,
  onCancel,
  style,
  subheader,
  submitText = i18n.t('submit'),
  title,
  type = 'default',
  submitOnEnter = false,
}: CustomModalWithSubmitProps) => {
  const { t } = useTranslation()
  const onSubmitHandler = (event: React.FormEvent) => {
    if (!onSubmit) return

    event.preventDefault()
    onSubmit()
  }

  return (
    <Modal
      disableAutoFocus={true}
      disableEnforceFocus={true}
      onClose={onClose}
      open={isOpen}
    >
      <Box>
        <Form onSubmit={onSubmitHandler}>
          <Card
            sx={{
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 'auto',
              left: '50%',
              maxHeight: maxHeight ? maxHeight : '90vh',
              maxWidth,
              minHeight: minHeight ? minHeight : 'auto',
              minWidth: 520,
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
              subheader={
                headerContent || subheader ? (
                  <Stack spacing={0.5}>
                    {headerContent}
                    {subheader && (
                      <Typography color="text.secondary" variant="body2">
                        {subheader}
                      </Typography>
                    )}
                  </Stack>
                ) : undefined
              }
              title={title}
            />
            <CardContent
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                padding: 2,
              }}
            >
              {children}
            </CardContent>
            {isEditable && (
              <CardActions>
                <Stack
                  alignItems="center"
                  direction="row"
                  justifyContent="space-between"
                  sx={{ width: '100%' }}
                >
                  {footerText && (
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 'small', fontStyle: 'italic' }}
                      variant="caption"
                    >
                      {footerText}
                    </Typography>
                  )}
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    spacing={1}
                    sx={{ width: '100%' }}
                  >
                    <Button
                      color={type === 'warning' ? 'inherit' : undefined}
                      disableElevation={true}
                      onClick={onCancel}
                      type="button"
                      variant="outlined"
                    >
                      {t('cancel')}
                    </Button>
                    <LoadingButton
                      color={type === 'warning' ? 'error' : undefined}
                      disableElevation={true}
                      disabled={disabledSubmit}
                      endIcon={
                        submitOnEnter ? (
                          <KeyboardReturnOutlined fontSize="small" />
                        ) : (
                          ''
                        )
                      }
                      loading={isSubmitting}
                      type="submit"
                      variant="contained"
                    >
                      {submitText}
                    </LoadingButton>
                  </Stack>
                </Stack>
              </CardActions>
            )}
          </Card>
        </Form>
      </Box>
    </Modal>
  )
}

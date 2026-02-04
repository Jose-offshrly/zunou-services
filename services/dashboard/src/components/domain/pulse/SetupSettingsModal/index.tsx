import {
  DeleteOutline,
  SettingsOutlined,
  WorkOutline,
} from '@mui/icons-material'
import { Icon, Stack, Typography } from '@mui/material'
import { alpha, lighten } from '@mui/material/styles'
import { Pulse, PulseMemberRole } from '@zunou-graphql/core/graphql'
import { useDeletePulseMutation } from '@zunou-queries/core/hooks/useDeletePulseMutation'
import { Button } from '@zunou-react/components/form'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { CustomModal } from '~/components/ui/CustomModal'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { usePulseStore } from '~/store/usePulseStore'
import { getPulseIcon } from '~/utils/getPulseIcon'

import { GeneralTab } from './tabs/GeneralTab'

enum TabIdentifier {
  GENERAL = 'general',
  PLAN = 'plan',
}

interface Props {
  handleClose: () => void
  isOpen: boolean
  pulse: Pulse | null
}

export const SetupSettingsModal = ({ handleClose, isOpen, pulse }: Props) => {
  const { t } = useTranslation(['common', 'pulse'])
  const { organizationId } = useOrganization()
  const [activeTab, setActiveTab] = useState<TabIdentifier>(
    TabIdentifier.GENERAL,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const navigate = useNavigate()
  const { mutate: deletePulse, isPending } = useDeletePulseMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { pulseMembership } = usePulseStore()

  const TABS_CONFIG = {
    GENERAL: {
      icon: SettingsOutlined,
      id: TabIdentifier.GENERAL,
      isActive: true,
      label: 'Pulse Settings',
    },
    PLAN: {
      icon: WorkOutline,
      id: TabIdentifier.PLAN,
      isActive: false,
      label: t('plan'),
    },
  } as const

  const handleDeleteConfirm = () => {
    if (!pulse?.id) return

    deletePulse(
      { pulseId: pulse.id },
      {
        onError: (error) => {
          toast.error('Failed to delete pulse')
          console.error(error)
        },
        onSuccess: () => {
          toast.success('Pulse deleted successfully')
          handleClose()
          navigate(
            pathFor({
              pathname: Routes.OrganizationBootstrap,
              query: {
                organizationId,
              },
            }),
          )
        },
      },
    )
  }

  const handleCloseWithReset = () => {
    setIsDeleting(false)
    handleClose()
  }

  return (
    <CustomModal
      headerActions={
        pulseMembership?.role === PulseMemberRole.Owner
          ? [
              {
                icon: DeleteOutline,
                onClick: () => setIsDeleting(true),
              },
            ]
          : []
      }
      isOpen={isOpen}
      {...(!isDeleting && { maxHeight: 556, minHeight: 556, minWidth: 900 })}
      onClose={handleCloseWithReset}
      style={{ maxWidth: isDeleting ? 400 : 800 }}
      title={isDeleting ? t('delete_pulse', { ns: 'pulse' }) : 'Setup'}
      withPadding={false}
    >
      {isDeleting ? (
        <Stack
          alignItems="center"
          gap={4}
          height="100%"
          justifyContent="center"
          px={2}
          py={1}
          width="100%"
        >
          <Stack
            alignItems="center"
            border={`1px solid ${lighten(theme.palette.primary.main, 0.9)}`}
            borderRadius={1}
            justifyContent="center"
            p={1.5}
            spacing={1}
            sx={{
              aspectRatio: '1 / 1',
            }}
            width="fit-content"
          >
            <Icon component={getPulseIcon(pulse?.type)} />
            <Typography
              sx={{
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                display: '-webkit-box',
                fontSize: 14,
                fontWeight: 700,
                maxWidth: 100,
                overflow: 'hidden',
              }}
              textAlign="center"
            >
              {pulse?.name}
            </Typography>
          </Stack>
          <Typography>
            {t('delete_pulse_confirmation', { ns: 'pulse' })}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              disabled={isPending}
              onClick={() => setIsDeleting(false)}
              variant="outlined"
            >
              {t('no')}
            </Button>
            <Button
              color="primary"
              disabled={isPending}
              onClick={handleDeleteConfirm}
              variant="contained"
            >
              {t('yes')}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack direction="row" height="100%" sx={{ minHeight: 0 }}>
          {/* Fixed sidebar with tabs */}
          <Stack
            minWidth={200}
            p={2}
            spacing={1}
            sx={{
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              flexShrink: 0,
            }}
          >
            {Object.entries(TABS_CONFIG).map(
              ([key, { icon, id, isActive, label }]) => {
                return (
                  <Button
                    disabled={!isActive}
                    key={key}
                    onClick={() => setActiveTab(id)}
                    startIcon={<Icon component={icon} fontSize="small" />}
                    sx={{
                      '&.Mui-disabled': {
                        '&:hover': {
                          bgcolor: 'transparent',
                        },
                        color: 'text.disabled',
                      },
                      alignItems: 'start',
                      bgcolor:
                        activeTab === id
                          ? alpha(theme.palette.primary.main, 0.1)
                          : '',
                      color: 'text.primary',
                      justifyContent: ' start',
                      paddingX: 2,
                      paddingY: 1,
                    }}
                  >
                    <Typography fontSize={14} fontWeight={4}>
                      {label}
                    </Typography>
                  </Button>
                )
              },
            )}
          </Stack>

          {/* Scrollable content area */}
          <Stack
            flex={1}
            sx={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.text.primary, 0.2),
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: alpha(theme.palette.text.primary, 0.3),
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              minHeight: 0,
              overflow: 'auto',
            }}
          >
            {activeTab === TabIdentifier.GENERAL && <GeneralTab />}

            {activeTab === TabIdentifier.PLAN && (
              <Typography>Plan content goes here.</Typography>
            )}
          </Stack>
        </Stack>
      )}
    </CustomModal>
  )
}

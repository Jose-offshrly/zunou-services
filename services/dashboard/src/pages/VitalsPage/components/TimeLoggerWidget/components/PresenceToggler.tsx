import {
  AccessAlarm,
  AdjustOutlined,
  LaptopMacOutlined,
} from '@mui/icons-material'
import { Typography, useTheme } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { UserPresence } from '@zunou-graphql/core/graphql'
import { useUpdateMeMutation } from '@zunou-queries/core/hooks/useUpdateMeMutation'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { IconButton } from 'zunou-react/components/form'

import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { toTitleCase } from '~/utils/textUtils'

const USER_PRESENCE_KEY = 'zunou_user_presence'

export const PresenceToggler = () => {
  const { t } = useTranslation('vitals')
  const { organizationId } = useOrganization()
  const { setting } = useVitalsContext()
  const muiTheme = useTheme()
  const isDarkMode = setting.theme === 'dark'

  const PRESENCE_OPTIONS: {
    status: UserPresence
    label: string
    icon: typeof LaptopMacOutlined
    color: string
    hoverColor: string
  }[] = [
    {
      color: 'common.green',
      hoverColor: theme.palette.common.green,
      icon: LaptopMacOutlined,
      label: t('checked_in'),
      status: UserPresence.Active,
    },
    {
      color: 'error.main',
      hoverColor: theme.palette.error.main,
      icon: AdjustOutlined,
      label: t('busy'),
      status: UserPresence.Busy,
    },
    {
      color: 'common.gold',
      hoverColor: theme.palette.common.gold,
      icon: AccessAlarm,
      label: t('hiatus'),
      status: UserPresence.Hiatus,
    },
  ]

  const [userStatus, setUserStatus] = useState<UserPresence>(() => {
    const savedStatus = localStorage.getItem(USER_PRESENCE_KEY)
    return savedStatus ? (savedStatus as UserPresence) : UserPresence.Active
  })

  const { mutate: updateMe } = useUpdateMeMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const toastStyle = {
    backgroundColor: isDarkMode ? muiTheme.palette.grey[900] : '#fff',
    border: isDarkMode
      ? `1px solid ${muiTheme.palette.grey[800]}`
      : '1px solid #e2e8f0',
    boxShadow: isDarkMode
      ? '0 4px 12px rgba(0, 0, 0, 0.4)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    color: isDarkMode ? muiTheme.palette.grey[100] : '#333',
  }

  useEffect(() => {
    updateMe(
      {
        lastOrganizationId: organizationId,
        presence: userStatus,
      },
      {
        onError: (error) => {
          console.error('Failed to sync user status. Error: ', error)
        },
      },
    )
  }, [])

  const handleUpdateUserPresence = (status: UserPresence) => {
    const previousStatus = userStatus

    setUserStatus(status)
    localStorage.setItem(USER_PRESENCE_KEY, status)

    updateMe(
      {
        lastOrganizationId: organizationId,
        presence: status,
      },
      {
        onError: (error) => {
          setUserStatus(previousStatus)
          localStorage.setItem(USER_PRESENCE_KEY, previousStatus)

          toast.error(t('update_status_error'), { style: toastStyle })
          console.error('Failed to update user status. Error: ', error)
        },
        onSuccess: () =>
          toast.success(
            `${t('update_status_success')} "${toTitleCase(status)}"`,
            {
              style: toastStyle,
            },
          ),
      },
    )
  }

  return (
    <Stack
      alignItems="center"
      direction="row"
      flexWrap="wrap"
      justifyContent="center"
      spacing={1}
    >
      {PRESENCE_OPTIONS.map(
        ({ status, label, icon: Icon, color, hoverColor }) => {
          const isActive = userStatus === status

          return (
            <IconButton
              disabled={isActive}
              key={status}
              onClick={() => handleUpdateUserPresence(status)}
              size="small"
              sx={{
                '&:hover': {
                  bgcolor: alpha(hoverColor, isDarkMode ? 0.2 : 0.1),
                },
                backgroundColor: 'transparent',
                border: '1px solid',
                borderColor: isActive
                  ? color
                  : isDarkMode
                    ? 'grey.700'
                    : 'divider',
                borderRadius: 9999,
                gap: 0.5,
              }}
            >
              <Icon
                fontSize="small"
                sx={{
                  color: color.includes('error') ? 'error.main' : color,
                }}
              />
              {isActive && (
                <Typography
                  color={color}
                  sx={{
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Typography>
              )}
            </IconButton>
          )
        },
      )}
    </Stack>
  )
}

import {
  AccountBalance,
  AccountBalanceOutlined,
  AdminPanelSettings,
  Analytics,
  Apps,
  AutoAwesome,
  BackupTableOutlined,
  Business,
  Diversity2,
  MeetingRoomOutlined,
  NotificationsOutlined,
  RocketLaunch,
  Settings,
  StyleOutlined,
  TerminalOutlined,
  TextSnippet,
} from '@mui/icons-material'
import { Avatar, Divider, SvgIcon, Typography, useTheme } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import type { PulseType } from '@zunou-graphql/core/graphql'
import { NotificationKind, ThreadType } from '@zunou-graphql/core/graphql'
import { useCreateSummaryOptionsMutation } from '@zunou-queries/core/hooks/useCreateSummaryOptionsMutation'
import { useCreateThreadMutation } from '@zunou-queries/core/hooks/useCreateThreadMutation'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { useOrganizationNotificationsQuery } from '@zunou-queries/core/hooks/useOrganizationNotificationsQuery'
import { useReadNotificationMutation } from '@zunou-queries/core/hooks/useReadNotificationMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { pathFor } from '@zunou-react/services/Routes'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { Widget } from '~/components/domain/vitals/widgets/Widget/Widget'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

import EmptyWidgetPlaceholder from '../EmptyWidgetPlaceholder'

interface NotificationsWidgetProps {
  widgetId: string
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
}

const iconMap: Record<PulseType, React.ComponentType> = {
  account: AccountBalance,
  admin: AdminPanelSettings,
  app: Apps,
  book: BackupTableOutlined,
  diversity: Diversity2,
  finance: Business,
  generic: AutoAwesome,
  hr: Analytics,
  linked: AccountBalanceOutlined,
  location: MeetingRoomOutlined,
  mcp: RocketLaunch,
  note: StyleOutlined,
  ops: Settings,
  rocket: RocketLaunch,
  sdk: TerminalOutlined,
  text: TextSnippet,
}

export const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({
  widgetId,
  isExpanded,
  onExpand,
}) => {
  const { t } = useTranslation('vitals')
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const { userRole, user } = useAuthContext()
  const { setting } = useVitalsContext()
  const muiTheme = useTheme()
  const isDarkMode = setting.theme === 'dark'

  const { mutateAsync: createSummaryOptions } = useCreateSummaryOptionsMutation(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    },
  )

  const { mutate: readNotification } = useReadNotificationMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: createThread } = useCreateThreadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    data: organizationNotificationsData,
    isFetching: isFetchingOrganizationNotifications,
    refetch,
  } = useOrganizationNotificationsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const { data: pulsesData } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const notifications =
    organizationNotificationsData?.organizationNotifications.data ?? []

  const handleRefresh = async () => {
    if (refetch) await refetch()
  }

  const getOrCreateThread = async (pulseId: string, threadType: ThreadType) => {
    // First try to get the active thread from the pulse data that belongs to the current user
    const pulse = pulsesData?.pulses.find((p) => p.id === pulseId)
    const activeThread = pulse?.threads?.find((t) => {
      if (t.isActive) {
        return t.userId === user?.id
      }
    })

    if (activeThread?.id) {
      return activeThread.id
    }

    // If no active thread exists for the current user, create a new one
    const response = await createThread({
      name: 'New Thread',
      organizationId,
      pulseId,
      type: threadType,
    })
    return response.createThread.id
  }

  const handleNotificationClick = async (
    pulseId?: string,
    summaryId?: string,
    notificationId?: string,
    kind?: NotificationKind,
  ) => {
    if (!pulseId) {
      return
    }

    try {
      if (summaryId && kind === NotificationKind.SummaryOption) {
        // Get or create active thread
        const threadType =
          userRole === UserRoleEnum.MANAGER
            ? ThreadType.Admin
            : userRole === UserRoleEnum.GUEST
              ? ThreadType.Guest
              : ThreadType.User

        const threadId = await getOrCreateThread(pulseId, threadType)

        if (!threadId) {
          throw new Error(t('create_thread_error'))
        }

        await createSummaryOptions({
          summaryId,
          threadId,
        })
      }

      if (notificationId) {
        readNotification({
          notificationId,
        })
      }

      const rolePrefix = userRole?.toLowerCase()
      navigate(
        `/${rolePrefix}/${pathFor({
          pathname: Routes.PulseDetail,
          query: { organizationId, pulseId },
        })}`,
      )
    } catch (error) {
      console.error('Error in notification click handler:', error)
      toast.error(t('create_summary_options_error'))
    }
  }

  return (
    <Widget
      id={WidgetKeysEnum.Notifications}
      isExpanded={isExpanded}
      isLoading={isFetchingOrganizationNotifications}
      name={t('notifications')}
      onExpand={onExpand}
      onRefresh={handleRefresh}
      showRefreshButton={true}
      widgetId={widgetId}
    >
      <Stack spacing={1} sx={{ height: '100%' }}>
        {notifications.length > 0 ? (
          notifications.map(
            ({ created_at, description, id, pulse, summary, kind }, index) => {
              const matchingPulse = pulsesData?.pulses.find(
                (p) => p.id === pulse?.id,
              )
              const iconValue = matchingPulse?.icon || pulse?.icon
              const IconComponent =
                (iconValue && iconMap[iconValue as PulseType]) ?? AutoAwesome

              return (
                <div key={id}>
                  <Stack
                    alignItems="flex-start"
                    direction="row"
                    onClick={() =>
                      handleNotificationClick(pulse?.id, summary?.id, id, kind)
                    }
                    padding={2}
                    spacing={2}
                    sx={{
                      '&:hover': {
                        backgroundColor: isDarkMode
                          ? alpha(muiTheme.palette.primary.main, 0.1)
                          : alpha(muiTheme.palette.secondary.main, 0.1),
                      },
                      color: isDarkMode ? 'grey.300' : 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    <Avatar
                      sx={{
                        alignItems: 'center',
                        bgcolor: isDarkMode
                          ? muiTheme.palette.primary.main
                          : alpha(muiTheme.palette.primary.main, 0.1),
                        display: 'flex',
                        fontSize: 10,
                        height: 24,
                        justifyContent: 'center',
                        marginTop: 0.5,
                        width: 24,
                      }}
                      variant="rounded"
                    >
                      <SvgIcon
                        component={IconComponent}
                        sx={{
                          color: isDarkMode
                            ? 'common.white'
                            : muiTheme.palette.primary.main,
                          fontSize: 14,
                        }}
                      />
                    </Avatar>
                    <Stack spacing={0.5}>
                      <Stack alignItems="center" direction="row" spacing={0.5}>
                        <Typography
                          fontSize="x-small"
                          sx={{
                            color: isDarkMode ? 'grey.100' : 'text.primary',
                            fontWeight: 'bold',
                          }}
                          variant="body1"
                        >
                          {pulse?.name}
                        </Typography>
                        <Typography
                          fontSize="x-small"
                          sx={{
                            color: isDarkMode ? 'grey.500' : 'text.secondary',
                          }}
                        >
                          •
                        </Typography>
                        <Typography
                          fontSize="x-small"
                          sx={{
                            color: isDarkMode ? 'grey.400' : 'text.secondary',
                          }}
                        >
                          {created_at}
                        </Typography>
                      </Stack>
                      <Typography
                        sx={{
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                          color: isDarkMode ? 'grey.100' : 'text.primary',
                          display: '-webkit-box',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        variant="body2"
                      >
                        {description}
                      </Typography>
                    </Stack>
                  </Stack>
                  {index < notifications.length - 1 && (
                    <Divider
                      sx={{ borderColor: isDarkMode ? 'grey.800' : undefined }}
                    />
                  )}
                </div>
              )
            },
          )
        ) : (
          <EmptyWidgetPlaceholder
            content={t('no_notifs')}
            icon={NotificationsOutlined}
          />
        )}
      </Stack>
    </Widget>
  )
}

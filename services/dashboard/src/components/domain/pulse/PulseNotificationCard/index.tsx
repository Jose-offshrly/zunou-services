import { ArticleOutlined, Checklist, ForumOutlined } from '@mui/icons-material'
import CheckIcon from '@mui/icons-material/Check'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Notification, NotificationKind } from '@zunou-graphql/core/graphql'
import { useCreateSummaryOptionsMutation } from '@zunou-queries/core/hooks/useCreateSummaryOptionsMutation'
import { useReadNotificationMutation } from '@zunou-queries/core/hooks/useReadNotificationMutation'
import { theme } from '@zunou-react/services/Theme'
import toast from 'react-hot-toast'
import { Descendant } from 'slate'

import { serializeToHTML } from '~/utils/textUtils'

export const PulseNotificationCard = ({
  threadId,
  notification,
  onNotificationClick,
}: {
  threadId?: string
  notification: Notification
  onNotificationClick?: (notification: Notification) => void
}) => {
  const { readAt: isReadNotification, id: notificationId } = notification

  const { mutateAsync: createSummaryOptions } = useCreateSummaryOptionsMutation(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    },
  )

  const { mutate: readNotification } = useReadNotificationMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleCreateSummaryOptions = async () => {
    const summaryId = notification.summary?.id
    if (!summaryId || !threadId) {
      toast.error('Missing required data for summary options creation')
      return
    }

    try {
      await createSummaryOptions({
        summaryId,
        threadId,
      })
    } catch (error) {
      toast.error('Failed to create summary options')
    }
  }

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick(notification)
    }

    switch (notification.kind) {
      case NotificationKind.SummaryOption:
        handleCreateSummaryOptions()
        readNotification({ notificationId })
        break
      default:
        readNotification({ notificationId })
        break
    }
  }

  const getNotificationContent = () => {
    try {
      const parsed: Descendant[] = JSON.parse(notification.description ?? '')

      if (Array.isArray(parsed)) {
        return serializeToHTML(parsed)
      }
    } catch (_err) {
      // Not JSON → fallback to legacy HTML/text
    }

    return notification.description ?? ''
  }

  // avatar color based on notification kind
  const getAvatarColor = (kind: NotificationKind): string => {
    switch (kind) {
      case NotificationKind.AssigneeCreated:
        return 'common.cherry'
      case NotificationKind.ChatMention:
        return 'common.dandelion'
      case NotificationKind.SummaryOption:
        return 'primary.main'
      default:
        return 'secondary.main'
    }
  }

  // avatar icon based on the notification kind
  const getAvatarIcon = (kind: NotificationKind): React.ReactNode => {
    switch (kind) {
      case NotificationKind.AssigneeCreated:
        return <Checklist sx={{ fontSize: 16 }} />
      case NotificationKind.ChatMention:
        return <ForumOutlined sx={{ fontSize: 16 }} />
      case NotificationKind.SummaryOption:
        return <ArticleOutlined sx={{ fontSize: 16 }} />
      default:
        return notification.pulse?.name?.[0]?.toUpperCase()
    }
  }

  return (
    <Card
      onClick={handleNotificationClick}
      sx={{
        backgroundColor: isReadNotification
          ? 'grey.50'
          : alpha(theme.palette.secondary.main, 0.03),
        borderColor: isReadNotification
          ? alpha(theme.palette.primary.main, 0.1)
          : alpha(theme.palette.secondary.main, 0.25),
        borderRadius: 2,
        borderStyle: 'solid',
        borderWidth: 1,
        boxShadow: 'none',
        cursor: 'pointer',
        fontWeight: isReadNotification ? 'fontWeightRegular' : 'fontWeightBold',
        height: 105,
        width: '100%',
      }}
    >
      <CardContent sx={{ height: '100%', overflow: 'hidden' }}>
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          mb={1}
        >
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
            sx={{
              flex: 1,
              minWidth: 0,
              mr: 1,
            }}
          >
            <Avatar
              sx={{
                bgcolor: getAvatarColor(notification.kind),
                flexShrink: 0,
                fontSize: 12,
                height: 24,
                width: 24,
              }}
              variant="rounded"
            >
              {getAvatarIcon(notification.kind)}
            </Avatar>
            <Stack
              alignItems="center"
              direction="row"
              spacing={1}
              sx={{
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <Typography
                fontSize={12}
                sx={{
                  fontWeight: 'fontWeightBold',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {notification.pulse?.name}
              </Typography>
              <Typography fontSize={12} sx={{ flexShrink: 0 }}>
                •
              </Typography>
              <Typography
                fontSize={11}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {notification.created_at}
              </Typography>
            </Stack>
          </Stack>
          {isReadNotification ? (
            <CheckIcon
              sx={{ color: 'primary.main', flexShrink: 0, fontSize: 16 }}
            />
          ) : (
            <FiberManualRecordIcon
              sx={{ color: 'secondary.main', flexShrink: 0, fontSize: 8 }}
            />
          )}
        </Stack>

        <Box
          dangerouslySetInnerHTML={{
            __html: getNotificationContent(),
          }}
          sx={{
            '& p': { margin: 0 },
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            display: '-webkit-box',
            fontSize: 'small',
            overflow: 'hidden',
            padding: '0 !important',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
          }}
        />
      </CardContent>
    </Card>
  )
}

import { Bookmark, TurnedInNotOutlined } from '@mui/icons-material'
import { Divider, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Stack } from '@mui/system'
import { useGetSavedMessagesQuery } from '@zunou-queries/core/hooks/useGetSavedMessagesQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { MessageContent } from '~/components/domain/threads/MessageListV2/components/MessageContent'
import { useContentParser } from '~/components/domain/threads/MessageListV2/hooks/useContentParser'
import { Widget, WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import EmptyWidgetPlaceholder from '../EmptyWidgetPlaceholder'

interface SavedMessagesWidgetProps {
  widgetId: string
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
}

export const SavedMessagesWidget: React.FC<SavedMessagesWidgetProps> = ({
  widgetId,
  isExpanded,
  onExpand,
}) => {
  const { t } = useTranslation('vitals')
  const { user, userRole } = useAuthContext()
  const { organizationId } = useOrganization()
  const navigate = useNavigate()
  const { setting } = useVitalsContext()
  const isDarkMode = setting.theme === 'dark'
  const muiTheme = useTheme()

  const { parseContent } = useContentParser()

  const rolePrefix = userRole && userRole.toLowerCase()

  const {
    data: savedMessagesData,
    isFetching: isFetchingSavedMessages,
    refetch,
  } = useGetSavedMessagesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      userId: user?.id,
    },
  })

  const savedMessages = savedMessagesData?.savedMessages.data ?? []

  const handleRefresh = async () => {
    if (refetch) {
      await refetch()
    }
  }

  const handleNavigateToPulse = (pulseId?: string | null) => {
    if (!pulseId) return

    navigate(
      pathFor({
        pathname: `/${rolePrefix}/${Routes.PulseDetail}`,
        query: {
          organizationId,
          panel: 'saved-messages',
          pulseId,
        },
      }),
    )
  }

  return (
    <Widget
      id={WidgetKeysEnum.Saved}
      isExpanded={isExpanded}
      isLoading={isFetchingSavedMessages}
      name={t('saved')}
      onExpand={onExpand}
      onRefresh={handleRefresh}
      showRefreshButton={true}
      widgetId={widgetId}
    >
      <Stack spacing={1} sx={{ height: '100%' }}>
        {savedMessages.length > 0 ? (
          savedMessages.map(({ created_at, id, thread, data }, index) => {
            const parsedContent = parseContent(data.content)

            return (
              <div key={id}>
                <Stack
                  alignItems="center"
                  direction="row"
                  onClick={() => handleNavigateToPulse(thread?.pulseId)}
                  padding={1.5}
                  spacing={1}
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
                  <Bookmark
                    color={isDarkMode ? 'primary' : 'secondary'}
                    fontSize="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                  <Stack spacing={1}>
                    <Stack
                      sx={{
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 4,
                        display: '-webkit-box',
                        fontSize: 'small',
                        overflow: 'hidden',
                      }}
                    >
                      <MessageContent
                        disableInteraction={true}
                        isTruncate={true}
                        parsedContent={parsedContent}
                        showTextOnly={true}
                        threadId={thread?.id ?? null}
                      />
                    </Stack>
                    <Stack alignItems="center" direction="row" spacing={1}>
                      <Typography
                        color={isDarkMode ? 'primary.main' : 'secondary.main'}
                        fontSize="x-small"
                        fontWeight="bold"
                        textTransform="capitalize"
                        variant="body2"
                      >
                        {thread?.pulse?.name ?? ''}{' '}
                        <Typography
                          color={isDarkMode ? 'grey.500' : 'text.secondary'}
                          component="span"
                          fontSize="x-small"
                          variant="body2"
                        >
                          • {formatDateAndTime(created_at)}
                        </Typography>
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
                {index < savedMessages.length - 1 && (
                  <Divider
                    sx={{
                      borderColor: isDarkMode ? 'grey.800' : undefined,
                    }}
                  />
                )}
              </div>
            )
          })
        ) : (
          <EmptyWidgetPlaceholder
            content={t('no_saved_msgs')}
            icon={TurnedInNotOutlined}
          />
        )}
      </Stack>
    </Widget>
  )
}

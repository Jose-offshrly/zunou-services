import { InboxOutlined } from '@mui/icons-material'
import { Divider } from '@mui/material'
import { Stack } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import { Pulse } from '@zunou-graphql/core/graphql'
import { useClearTeamMessagesMutation } from '@zunou-queries/core/hooks/useClearTeamMessagesMutation'
import { useGetUnreadTeamMessagesQuery } from '@zunou-queries/core/hooks/useGetUnreadTeamMessagesQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Widget, WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { Routes } from '~/services/Routes'

import ActionButton from '../ActionButton'
import EmptyWidgetPlaceholder from '../EmptyWidgetPlaceholder'
import TeamChat from './components/TeamChat'

interface PingBoardWidgetProps {
  widgetId: string
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
}

const PingBoardWidget = ({
  widgetId,
  isExpanded,
  onExpand,
}: PingBoardWidgetProps) => {
  const { t } = useTranslation(['common', 'vitals'])
  const { user, userRole } = useAuthContext()
  const { organizationId } = useOrganization()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [localFilteredState, setLocalFilteredTasks] = useState<Pulse[]>([])

  const {
    data: unreadTeamMessagesData,
    isFetching: isUnreadTeamMessagesFetching,
  } = useGetUnreadTeamMessagesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const {
    mutateAsync: clearTeamMessages,
    isPending: isClearTeamMesagesPending,
  } = useClearTeamMessagesMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const clearHandler = async () => {
    if (!organizationId) return

    await clearTeamMessages(organizationId)
  }

  useEffect(() => {
    if (!unreadTeamMessagesData) return

    const filtered =
      unreadTeamMessagesData.unreadTeamMessages?.filter(
        (teamMessage) =>
          teamMessage.unread_team_messages.filter(
            (msg) => msg.user?.id !== user?.id,
          ).length > 0,
      ) ?? []

    setLocalFilteredTasks(filtered)
  }, [unreadTeamMessagesData])

  const readLaterHandler = (pulseId: string) => {
    setLocalFilteredTasks((prev) => {
      const itemToMove = prev.find((item) => item.id === pulseId)
      if (!itemToMove) return prev // No change if not found

      const updated = prev.filter((item) => item.id !== pulseId)
      return [...updated, itemToMove]
    })
  }

  const redirectHandler = (pulseId: string) => {
    const rolePrefix = userRole?.toLowerCase()
    navigate(
      `/${rolePrefix}/${pathFor({
        pathname: Routes.PulseTeamChat,
        query: { organizationId, pulseId },
      })}`,
    )
  }

  usePusherChannel({
    channelName: `team-messages.${organizationId}`,
    eventName: '.team-messages-sent',
    onEvent: () => {
      console.log('New unread team message!')
      queryClient.invalidateQueries({
        queryKey: ['unreadTeamMessages', organizationId],
      })
    },
  })

  return (
    <Widget
      actions={
        <ActionButton
          handleClick={clearHandler}
          isLoading={isClearTeamMesagesPending}
          text={t('clear')}
        />
      }
      id={WidgetKeysEnum.TeamChat}
      isExpanded={isExpanded}
      isLoading={isUnreadTeamMessagesFetching}
      name={t('team_chat', { ns: 'vitals' })}
      onExpand={onExpand}
      widgetId={widgetId}
    >
      <Stack
        borderColor={theme.palette.divider}
        divider={<Divider />}
        gap={2}
        height="100%"
      >
        {localFilteredState.length > 0 ? (
          localFilteredState.map(({ id, name, unread_team_messages }) => {
            return (
              <TeamChat
                id={id}
                key={id}
                messages={unread_team_messages.filter(
                  (msg) => msg.user?.id !== user?.id,
                )}
                pulseName={name}
                readLaterHandler={readLaterHandler}
                redirectHandler={redirectHandler}
              />
            )
          })
        ) : (
          <EmptyWidgetPlaceholder
            content={t('no_unread_msgs', { ns: 'vitals' })}
            icon={InboxOutlined}
          />
        )}
      </Stack>
    </Widget>
  )
}

export default PingBoardWidget

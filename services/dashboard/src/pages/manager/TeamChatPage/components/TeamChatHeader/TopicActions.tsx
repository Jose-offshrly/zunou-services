import { PushPinOutlined } from '@mui/icons-material'
import { Stack } from '@mui/material'
import type { GetPinnedTeamMessagesQuery } from '@zunou-graphql/core/graphql'
import { IconButton } from '@zunou-react/components/form/IconButton'

import { TeamPinnedMessagesDropdown } from '~/pages/manager/TeamChatPage/components/PinnedMessagesDropdown/TeamPinnedMessagesDropdown'

import MessageSearch from './MessageSearch'

interface TopicActionsProps {
  pinnedMessagesData?: GetPinnedTeamMessagesQuery
  isLoadingPinnedMessages: boolean
  pinnedAnchorEl: HTMLElement | null
  onPinnedButtonClick: (event: React.MouseEvent<HTMLElement>) => void
  onPinnedClose: () => void
  onPinnedMessageClick: (message: {
    id: string
    gravatar: string
    name: string
    dateCreated: string
    message: string
  }) => void
  onMouseDown: (e: React.MouseEvent) => void
  onUnpinMessage?: (messageId: string) => void
}

export const TopicActions = ({
  pinnedMessagesData,
  isLoadingPinnedMessages,
  pinnedAnchorEl,
  onPinnedButtonClick,
  onPinnedClose,
  onPinnedMessageClick,
  onMouseDown,
  onUnpinMessage,
}: TopicActionsProps) => {
  const pinnedOpen = Boolean(pinnedAnchorEl)

  return (
    <>
      <Stack
        alignItems="center"
        direction="row"
        ml={1}
        spacing={1}
        sx={{ flexShrink: 0 }}
      >
        <IconButton onClick={onPinnedButtonClick} size="small">
          <PushPinOutlined sx={{ fontSize: '20px' }} />
        </IconButton>

        <MessageSearch />
      </Stack>

      {/* Pinned Messages Dropdown */}
      <TeamPinnedMessagesDropdown
        anchorEl={pinnedAnchorEl}
        isLoading={isLoadingPinnedMessages}
        onClose={onPinnedClose}
        onMessageClick={onPinnedMessageClick}
        onMouseDown={onMouseDown}
        onUnpinMessage={onUnpinMessage}
        open={pinnedOpen}
        pinnedMessagesData={pinnedMessagesData}
      />
    </>
  )
}

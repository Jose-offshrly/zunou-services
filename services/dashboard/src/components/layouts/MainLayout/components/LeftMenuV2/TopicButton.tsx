import { Tag } from '@mui/icons-material'
import { Box, Button, Stack, Tooltip } from '@mui/material'

import {
  SelectedTab,
  SelectedTabEnum,
  SelectedTopic,
} from '~/store/usePulseStore'

import UnreadCounter from '../UnreadCounter'

interface TopicButtonProps {
  id?: string
  name: string
  unreadCount: number
  isSelected: boolean
  onButtonClick: (
    e: React.MouseEvent,
    tab?: SelectedTab,
    topic?: SelectedTopic,
  ) => void
}

export default function TopicButton({
  id = 'general',
  name,
  unreadCount,
  isSelected,
  onButtonClick,
}: TopicButtonProps) {
  return (
    <Tooltip disableInteractive={true} placement="right" title={name}>
      <Button
        fullWidth={true}
        onClick={(e) =>
          onButtonClick(e, SelectedTabEnum.TEAM_CHAT, {
            hasUnread: false,
            id,
            name,
          })
        }
        startIcon={<Tag fontSize="small" />}
        sx={{
          '&:hover': { backgroundColor: 'action.hover' },
          bgcolor: isSelected ? 'action.hover' : undefined,
          color: isSelected ? 'primary.main' : 'text.secondary',
          fontWeight: 500,
          justifyContent: 'flex-start',
          textTransform: 'none',
        }}
      >
        <Stack alignItems="center" direction="row" gap={1}>
          <Box
            sx={{
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              display: id === 'general' ? 'block' : '-webkit-box',
              maxWidth: 150,
              overflow: 'hidden',
              overflowWrap: 'break-word',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
            }}
          >
            {name}
          </Box>
          {unreadCount > 0 && <UnreadCounter unread={unreadCount} />}
        </Stack>
      </Button>
    </Tooltip>
  )
}

import { alpha, Avatar, Box, Stack } from '@mui/material'
import type { Message } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

import pulseLogo from '~/assets/pulse-logo.png'
import { checkIfAIGenerated } from '~/utils/checkIfAIGenerated'

interface MessageListProps {
  messages: Message[]
  lastMessageElementRef: (node: HTMLDivElement | null) => void
}

export const MessageList = ({
  messages,
  lastMessageElementRef,
}: MessageListProps) => {
  return (
    <Stack gap={2} maxWidth={752} width="100%">
      {messages?.map(({ id, role }, index) => {
        return (
          <Stack
            direction={checkIfAIGenerated(role) ? 'row' : 'row-reverse'}
            id={id}
            justifyContent={checkIfAIGenerated(role) ? 'start' : 'end'}
            key={id}
            ref={index + 1 === messages.length ? lastMessageElementRef : null}
            spacing={2}
          >
            {checkIfAIGenerated(role) && (
              <Avatar
                alt="assistant"
                src={pulseLogo}
                sx={{ height: 32, width: 32 }}
              />
            )}
            <Box
              bgcolor={
                checkIfAIGenerated(role)
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.muted.main, 0.05)
              }
              borderRadius={
                checkIfAIGenerated(role) ? '0px 16px 16px 16px' : '16px'
              }
              minWidth={240}
              padding={2}
              width="60%"
            >
              {/* <FormattedContent parsedContent={{ content: content ?? '' }} /> */}
            </Box>
          </Stack>
        )
      })}
    </Stack>
  )
}

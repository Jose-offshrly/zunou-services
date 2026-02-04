import { Stack } from '@mui/material'
import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import { useCreateTeamMessageMutation } from '@zunou-queries/core/hooks/useCreateTeamMessageMutation'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { truncate } from 'lodash'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { useOrganization } from '~/hooks/useOrganization'
import { useTopicStore } from '~/store/useTopicStore'

import { MAX_CHAR_PREV_MODE } from '../components/MessageContent'
import MainUiMessage from './MainUiMessage'

interface ConfirmationProps {
  message: string
  prompt: string
  actions: { label: string; suggested_reply: string }[]
  disableInteraction?: boolean
  isTruncate?: boolean
  showTextOnly?: boolean
  isMiniPulseChat?: boolean
  threadId: string | null
  replyTeamThreadId?: string
}
const Confirmation = ({
  message,
  prompt,
  actions,
  disableInteraction = false,
  isTruncate = false,
  showTextOnly = false,
  isMiniPulseChat = false,
  threadId,
  replyTeamThreadId,
}: ConfirmationProps) => {
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { currentPulseTopic } = useTopicStore()

  const [disabled, setDisabled] = useState(false)

  const {
    mutateAsync: createCompletion,
    isPending: isCreateCompletionPending,
  } = useCreateCompletionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    mutateAsync: createTeamMessage,
    isPending: isCreateTeamMessagePending,
  } = useCreateTeamMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handlePulsePrompt = (value: string) => {
    if (!threadId) {
      toast.error('Missing thread ID.')
      return
    }

    setDisabled(true)

    createCompletion(
      {
        message: value,
        organizationId,
        threadId,
        topicId:
          currentPulseTopic && currentPulseTopic.id !== 'general'
            ? currentPulseTopic.id
            : undefined,
      },
      { onError: () => toast.error('Something went wrong, message not sent.') },
    )
  }

  const handleMiniPulsePrompt = (value: string) => {
    if (!threadId) {
      toast.error('Missing thread ID.')
      return
    }

    if (!user) {
      toast.error('Missing user.')
      return
    }

    setDisabled(true)

    createTeamMessage(
      {
        content: `@pulse ${value}`,
        replyTeamThreadId,
        teamThreadId: threadId,
        userId: user.id,
      },
      { onError: () => toast.error('Something went wrong, message not sent.') },
    )
  }

  return (
    <Stack gap={2}>
      <MainUiMessage
        showBorderBottom={false}
        text={
          isTruncate
            ? truncate(message, { length: MAX_CHAR_PREV_MODE })
            : message
        }
      />
      {!showTextOnly && (
        <Stack
          alignItems="center"
          border={1}
          borderColor="divider"
          direction="row"
          flexWrap="wrap"
          gap={2}
          justifyContent="space-between"
          px={2}
          py={1}
        >
          <Stack sx={{ display: 'inline-block', maxWidth: '50%' }}>
            <Markdown remarkPlugins={[remarkGfm]}>{prompt}</Markdown>
          </Stack>
          <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}>
            {actions.map((actions, index) => (
              <Button
                disabled={
                  disabled ||
                  isCreateCompletionPending ||
                  isCreateTeamMessagePending ||
                  disableInteraction
                }
                key={actions.suggested_reply}
                onClick={() =>
                  isMiniPulseChat
                    ? handleMiniPulsePrompt(actions.suggested_reply)
                    : handlePulsePrompt(actions.suggested_reply)
                }
                variant={index % 2 === 0 ? 'contained' : 'outlined'}
              >
                {actions.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}

export default Confirmation

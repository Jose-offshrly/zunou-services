import { Circle } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import { useCreateTeamMessageMutation } from '@zunou-queries/core/hooks/useCreateTeamMessageMutation'
import { Button } from '@zunou-react/components/form'
import { OptionUI } from '@zunou-react/components/form/FormattedContent'
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

const IGNORE_KEYS = ['meeting_date']

const Item = ({
  label,
  metadata,
  disabled = false,
  onClick,
}: {
  label: string
  metadata?: Record<string, string>
  disabled?: boolean
  onClick: () => void
}) => {
  const [selected, setSelected] = useState(false)

  // Helper function to render metadata
  const renderMetadata = () => {
    if (!metadata || typeof metadata !== 'object') return null

    const metadataEntries = Object.entries(metadata).filter(
      ([key, value]) => value && !IGNORE_KEYS.includes(key),
    ) // Filter out empty values and ignored keys

    if (metadataEntries.length === 0) return null

    return (
      <Stack
        alignItems="center"
        direction="row"
        divider={
          <Circle
            sx={{
              color: 'divider',
              flexShrink: 0,
              fontSize: 8, // Prevents divider from shrinking
            }}
          />
        }
        gap={1}
        sx={{
          flexWrap: 'wrap',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {metadataEntries.map(([key, value]) => (
          <Typography
            color="text.secondary"
            key={key}
            sx={{
              maxWidth: '100%',
              minWidth: 0,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
            variant="body2"
          >
            {value}
          </Typography>
        ))}
      </Stack>
    )
  }

  return (
    <Stack
      alignItems="center"
      bgcolor="Background"
      borderRadius={1}
      direction="row"
      gap={3}
      height="100%"
      p={2}
    >
      <Stack alignItems="center" direction="row" gap={1} width="100%">
        <Stack flex={1} gap={1} height="100%">
          <Typography
            fontWeight="bold"
            sx={{
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
            variant="body1"
          >
            {label}
          </Typography>
          {renderMetadata()}
        </Stack>
      </Stack>
      <Stack>
        <Button
          disabled={disabled}
          onClick={() => {
            setSelected(!selected)
            onClick()
          }}
          size="large"
          variant="outlined"
        >
          {selected ? 'Unselect' : 'Select'}
        </Button>
      </Stack>
    </Stack>
  )
}

interface OptionsProps {
  message: string
  multiSelect: boolean
  items: OptionUI[]
  disableInteraction?: boolean
  isTruncate?: boolean
  showTextOnly?: boolean
  isMiniPulseChat?: boolean
  threadId: string | null
  replyTeamThreadId?: string
}
const Options = ({
  message,
  items,
  multiSelect,
  disableInteraction = false,
  isTruncate = false,
  showTextOnly = false,
  isMiniPulseChat = false,
  threadId,
  replyTeamThreadId,
}: OptionsProps) => {
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { currentPulseTopic } = useTopicStore()

  const [disabled, setDisabled] = useState(false)
  const [_selectedValues, setSelectedValues] = useState<string[]>([])

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

  const onItemClick = (value: string) => {
    if (!multiSelect) {
      setDisabled(true)
      if (isMiniPulseChat) handleMiniPulsePrompt(value)
      else handlePulsePrompt(value)
    }

    // Toggle value
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  return (
    <Stack gap={3}>
      <MainUiMessage
        showBorderBottom={false}
        text={
          isTruncate
            ? truncate(message, { length: MAX_CHAR_PREV_MODE })
            : message
        }
      />

      {!showTextOnly && (
        <Stack gap={2}>
          <Stack gap={2} height="100%">
            {items.map((opt) => (
              <Item
                disabled={
                  disabled ||
                  isCreateCompletionPending ||
                  isCreateTeamMessagePending ||
                  disableInteraction
                }
                key={opt.suggested_reply}
                label={opt.label}
                metadata={opt.option_context}
                onClick={() => onItemClick(opt.suggested_reply)}
              />
            ))}
          </Stack>
          {multiSelect && (
            <Stack
              alignItems="center"
              border={1}
              borderColor="divider"
              direction="row"
              gap={1}
              justifyContent="space-between"
              px={2}
              py={1}
            >
              <Markdown remarkPlugins={[remarkGfm]}>
                {
                  'Please click the ***Confirm*** button to confirm selection of tickets.'
                }
              </Markdown>
              <Stack alignItems="center" direction="row" gap={1}>
                <Button variant="contained">Confirm</Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default Options

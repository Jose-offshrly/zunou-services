import { Cancel } from '@mui/icons-material'
import { alpha, Box, Stack, Typography } from '@mui/material'
import { IconButton } from '@zunou-react/components/form'
import { useParams } from 'react-router-dom'
import { Descendant } from 'slate'

import { useContentParser } from '~/components/domain/threads/MessageListV2/hooks/useContentParser'
import { PulseActions } from '~/store/usePulseStore'
import { serializeToHTML } from '~/utils/textUtils'

import { ParsedContentUI } from '../MessageContentUI'

interface Props {
  clear: ({ pulseId }: { pulseId: string }) => void
  replyingTo: PulseActions['replyingToTeamChat']
}

export default function ReplyingToPreview({ clear, replyingTo }: Props) {
  const { parseContent } = useContentParser()
  const { pulseId } = useParams<{ pulseId?: string }>()

  const parsedContent = parseContent(replyingTo?.content ?? '')

  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      px={2}
      py={1.5}
      sx={(theme) => ({
        bgcolor: alpha(theme.palette.primary.light, 0.1),
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      })}
    >
      <Stack alignItems="center" direction="row" gap={1}>
        <Typography fontSize="small">
          Replying to{' '}
          <Typography component="span" fontSize="small" fontWeight={600}>
            {replyingTo?.name.toLowerCase() === 'pulse'
              ? 'Pulse'
              : replyingTo?.name}
          </Typography>
          :{' '}
        </Typography>

        <Box
          dangerouslySetInnerHTML={{
            __html: (() => {
              try {
                const parsed: Descendant[] | ParsedContentUI = JSON.parse(
                  replyingTo?.content ?? '',
                )

                // Slate message format
                if (Array.isArray(parsed)) {
                  return serializeToHTML(parsed)
                }

                // Message with UI - check if it has the MessageContentUI structure
                if (
                  parsed &&
                  typeof parsed === 'object' &&
                  'message' in parsed &&
                  'ui' in parsed
                ) {
                  return parsed.message
                }
              } catch (_err) {
                // Not JSON → fallback to legacy HTML
              }

              return parsedContent?.summary ?? ''
            })(),
          }}
          sx={{
            '& p': { margin: 0 },
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 1,
            color: 'inherit',
            display: '-webkit-box',
            flex: 1,
            fontSize: 'small',
            minWidth: 0,

            overflow: 'hidden',
            overflowWrap: 'break-word',
            padding: '0 !important',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
          }}
        />
      </Stack>

      <IconButton
        onClick={pulseId ? () => clear({ pulseId }) : undefined}
        size="small"
      >
        <Cancel
          fontSize="small"
          sx={(theme) => ({ color: theme.palette.primary.light })}
        />
      </IconButton>
    </Stack>
  )
}

import { Warning } from '@mui/icons-material'
import { Box, Typography } from '@mui/material'
import { File } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { Descendant } from 'slate'

import { useEditing } from '~/context/MessageListContext'
import { serializeToHTML } from '~/utils/textUtils'

import { UpdateMessageEditor } from '../UpdateMessageEditor'

export const MessageContent = ({
  id,
  content,
  isEdited = false,
  isDeleted = false,
  organizationId,
  onUpdateComplete,
  replyTeamThreadId,
  files,
  isAlertMessage = false,
}: {
  content: string | null
  id?: string
  isEdited?: boolean
  isDeleted?: boolean
  organizationId?: string
  onUpdateComplete?: () => void
  replyTeamThreadId?: string
  files?: File[]
  isAlertMessage?: boolean
}) => {
  const { currentEditingId } = useEditing()
  const isEditing = currentEditingId === id

  const displayContent = isDeleted ? 'Message has been deleted.' : content

  if (isEditing && !isDeleted && id) {
    return (
      <UpdateMessageEditor
        content={content ?? ''}
        files={files}
        id={id}
        onUpdateComplete={onUpdateComplete}
        organizationId={organizationId}
        replyTeamThreadId={replyTeamThreadId}
      />
    )
  }

  return (
    <>
      {/* warning icon for alert messages */}
      <Box sx={{ display: 'inline-block', position: 'relative' }}>
        {isAlertMessage && (
          <Box
            sx={{
              alignItems: 'center',
              backgroundColor: 'common.cherry',
              borderRadius: '50%',
              display: 'flex',
              height: '20px',
              justifyContent: 'center',
              left: '-10px',
              position: 'absolute',
              top: '-10px',
              width: '20px',
            }}
          >
            <Warning
              sx={{
                color: 'white',
                fontSize: '12px',
              }}
            />
          </Box>
        )}

        <Box
          dangerouslySetInnerHTML={{
            __html: (() => {
              try {
                const parsed: Descendant[] = JSON.parse(displayContent ?? '')
                if (Array.isArray(parsed)) {
                  return serializeToHTML(parsed)
                }
              } catch (_err) {
                // Not JSON → fallback to legacy HTML
              }
              return displayContent ?? ''
            })(),
          }}
          sx={{
            '& em': {
              fontStyle: 'italic',
            },
            '& li': {
              marginBottom: '0',
            },
            '& li:last-child': {
              marginBottom: 0,
            },
            '& p': { margin: 0, marginBottom: '0' },
            '& p:last-child': { marginBottom: 0 },
            '& s': {
              textDecoration: 'line-through',
            },
            '& strong': {
              fontWeight: 'bold',
            },
            '& u': {
              textDecoration: 'underline',
            },
            '& ul, & ol': {
              marginBottom: '0.5em',
              marginTop: '0',
              paddingLeft: '1.5em',
            },
            '& ul:last-child, & ol:last-child': {
              marginBottom: 0,
            },
            color: isDeleted ? 'text.secondary' : 'inherit',
            fontStyle: isDeleted ? 'italic' : 'normal',
            padding: '0 !important',
            wordBreak: 'break-word',
            ...(isAlertMessage && {
              backgroundColor: 'common.pink',
              border: '1px solid',
              borderColor: 'common.cherry',
              borderRadius: '10px',
              padding: '10px 8px',
            }),
          }}
        />
      </Box>

      {isEdited && !isDeleted && (
        <Typography
          component="span"
          sx={{
            color: theme.palette.text.secondary,
            display: 'inline',
            fontStyle: 'italic',
            mt: 1,
          }}
          variant="body2"
        >
          (Edited)
        </Typography>
      )}
    </>
  )
}

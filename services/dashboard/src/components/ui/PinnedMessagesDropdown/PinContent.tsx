import { InsertDriveFileOutlined } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { File } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { truncate } from 'lodash'
import { useMemo } from 'react'
import { Descendant } from 'slate'

import { MessageContent } from '~/components/domain/threads/MessageListV2/components/MessageContent'
import { useContentParser } from '~/components/domain/threads/MessageListV2/hooks/useContentParser'
import { MessageContentUI } from '~/pages/manager/TeamChatPage/components/MessageContentUI'
import { serializeToHTML } from '~/utils/textUtils'

import { PinnedMessage } from './PinnedMessagesDropdown'

interface Props {
  hasUIContent: boolean
  message: PinnedMessage
}

export default function PinContent({ hasUIContent, message }: Props) {
  const { parseContent } = useContentParser()

  const parsedContent = parseContent(message.message ?? '')

  const files = message.fileAttachments

  const { imageFiles, nonImageFiles } = useMemo(() => {
    if (!files || files.length === 0) {
      return { imageFiles: [], nonImageFiles: [] }
    }

    const images: File[] = []
    const nonImages: File[] = []

    files.forEach((file) => {
      const isImage = file.type?.startsWith('image/')
      if (isImage) {
        images.push(file)
      } else {
        nonImages.push(file)
      }
    })

    return { imageFiles: images, nonImageFiles: nonImages }
  }, [files])

  const handleImageClick = (url: string, event: React.MouseEvent) => {
    event.stopPropagation()
    window.open(url, '_blank')
  }

  const handleFileClick = (url: string, event: React.MouseEvent) => {
    event.stopPropagation()
    window.open(url, '_blank')
  }

  const getTruncatedFileName = (fileName: string, maxLength = 20) => {
    const lastDotIndex = fileName.lastIndexOf('.')
    if (lastDotIndex === -1) {
      return truncate(fileName, { length: maxLength, omission: '...' })
    }

    const name = fileName.substring(0, lastDotIndex)
    const extension = fileName.substring(lastDotIndex)

    const truncatedName = truncate(name, {
      length: maxLength - extension.length,
      omission: '...',
    })

    return truncatedName + extension
  }

  return (
    <Stack spacing={1}>
      {/* Message Content */}
      {message.isSentByPulse ? (
        <MessageContent
          disableInteraction={false}
          isMiniPulseChat={true}
          // onAttachmentClick={onAttachmentClick}
          parsedContent={parsedContent}
          threadId={''}
        />
      ) : hasUIContent ? (
        <MessageContentUI
          bgcolor="transparent"
          content={message.message}
          hasPadding={false}
          isDeleted={message.isDeleted}
          showBorder={false}
          shrink={true}
        />
      ) : (
        <Box
          dangerouslySetInnerHTML={{
            __html: (() => {
              try {
                const parsed: Descendant[] = JSON.parse(message.message ?? '')

                if (Array.isArray(parsed)) {
                  return serializeToHTML(parsed)
                }
              } catch {
                // Error parsing message content, return as-is
              }
              return message.message ?? ''
            })(),
          }}
          sx={{
            '& p': { margin: 0 },
            color: theme.palette.text.primary,
            fontSize: 'small',
            lineHeight: 1.4,
            marginTop: '4px',
            wordBreak: 'break-word',
          }}
        />
      )}

      {/* Image Files - Tiled Row with Wrap (Squared) */}
      {imageFiles.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ marginTop: 1 }}>
          {imageFiles.map((file, idx) => (
            <Box
              key={file.id ?? idx}
              onClick={(event) => handleImageClick(file.url ?? '', event)}
              sx={{
                '&:hover': {
                  opacity: 0.8,
                },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                height: 70,
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out',
                width: 70,
              }}
            >
              <img
                alt={file.file_name ?? 'attachment'}
                src={file.url ?? ''}
                style={{
                  backgroundColor: 'black',
                  display: 'block',
                  height: '100%',
                  objectFit: 'cover',
                  width: '100%',
                }}
              />
            </Box>
          ))}
        </Stack>
      )}

      {/* Non-Image Files - Column Direction */}
      {nonImageFiles.length > 0 && (
        <Stack direction="column" gap={1} sx={{ marginTop: 1 }}>
          {nonImageFiles.map((file, idx) => {
            const displayName = getTruncatedFileName(file.file_name ?? 'file')

            return (
              <Box
                key={file.id ?? idx}
                onClick={(event) => handleFileClick(file.url ?? '', event)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 1,
                  height: 60,
                  justifyContent: 'flex-start',
                  position: 'relative',
                  px: 1.5,
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Box
                  sx={{
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                    color: 'white',
                    display: 'flex',
                    fontSize: 14,
                    fontWeight: 600,
                    height: 32,
                    justifyContent: 'center',
                    width: 32,
                  }}
                >
                  <InsertDriveFileOutlined fontSize="small" />
                </Box>
                <Typography fontSize="small" sx={{ fontWeight: 600 }}>
                  {displayName}
                </Typography>
              </Box>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}

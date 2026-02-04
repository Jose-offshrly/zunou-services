import { alpha, Box, Stack, Typography } from '@mui/material'
import { Note } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { formatFileSize } from '@zunou-react/utils/formatFileSize'
import { useRef } from 'react'

import { getFileIcon } from '../../components/FileIcons'
import { isImageFile } from '../../utils/fileUtils'

interface NoteItemContentProps {
  note: Note
}

export const NoteItemContent = ({ note }: NoteItemContentProps) => {
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <Stack flex={1} minHeight={0} spacing={1}>
      {note.files && note.files.length > 0 && (
        <Stack spacing={1} width="100%">
          {note.files
            .filter((file) => !isImageFile(file) || !file.url)
            .map((file) => (
              <Stack
                direction="row"
                key={file.id}
                sx={{
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 2,
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <Stack
                  sx={{
                    alignItems: 'center',
                    backgroundColor: alpha(theme.palette.primary.main, 0.25),
                    borderBottomLeftRadius: 8,
                    borderTopLeftRadius: 8,
                    flexShrink: 0,
                    height: 60,
                    justifyContent: 'center',
                    p: 1,
                    width: 60,
                  }}
                >
                  {getFileIcon(file)}
                </Stack>

                <Stack
                  sx={{
                    borderBottomRightRadius: 8,
                    borderTopRightRadius: 8,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    fontSize={12}
                    sx={{
                      overflow: 'hidden',
                      px: 1,
                      py: 0.5,
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.file_name || file.path.split('/').pop()}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ pb: 0.5, px: 1 }}>
                    {file.size && (
                      <Typography
                        color="text.secondary"
                        fontSize={10}
                        variant="caption"
                      >
                        {formatFileSize(file.size)}
                      </Typography>
                    )}
                    <Typography
                      color="text.secondary"
                      fontSize={10}
                      variant="caption"
                    >
                      {file.type || 'Unknown type'}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            ))}

          {note.files
            .filter((file) => isImageFile(file) && file.url)
            .map((file) => (
              <Box key={file.id} sx={{ width: '100%' }}>
                <Box
                  alt={file.file_name || file.path.split('/').pop() || 'Image'}
                  component="img"
                  src={file.url || ''}
                  sx={{
                    borderRadius: 1,
                    height: 160,
                    objectFit: 'cover',
                    width: '100%',
                  }}
                />
              </Box>
            ))}
        </Stack>
      )}

      <Stack
        dangerouslySetInnerHTML={{ __html: note.content || '' }}
        ref={contentRef}
        sx={{
          '& p': {
            margin: 0,
            padding: 0,
          },
          color: 'text.primary',
          fontSize: 14,
          wordBreak: 'break-word',
        }}
      />
    </Stack>
  )
}

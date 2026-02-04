import { InsertDriveFileOutlined } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { File } from '@zunou-graphql/core/graphql'
import { truncate } from 'lodash'

interface Props {
  files: File[]
  isFlipped?: boolean
}

export default function AttachmentTray({ files, isFlipped }: Props) {
  const isImage = (mimeType: string | null | undefined) => {
    return mimeType?.startsWith('image/')
  }

  const handleImageClick = (url: string) => {
    window.open(url, '_blank')
  }

  const handleFileClick = (url: string) => {
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

  // Separate images and non-images, then combine based on isFlipped
  const images = files.filter((file) => isImage(file.type))
  const nonImages = files.filter((file) => !isImage(file.type))

  const sortedFiles = [...images, ...nonImages]

  if (files.length <= 0) return null

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1}
      sx={{
        justifyContent: isFlipped ? 'flex-end' : 'flex-start',
      }}
    >
      {sortedFiles.map((file, idx) => {
        if (isImage(file.type)) {
          return (
            <Box
              key={file.id ?? idx}
              onClick={() => handleImageClick(file.url ?? '')}
              sx={{
                '&:hover': {
                  opacity: 0.8,
                },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <img
                alt={file.file_name ?? 'attachment'}
                src={file.url ?? ''}
                style={{
                  backgroundColor: 'black',
                  display: 'block',
                  height: 'auto',
                  maxHeight: 80,
                  width: 'auto',
                }}
              />
            </Box>
          )
        }

        // const extension = file.file_name?.split('.').pop()?.toUpperCase() || 'F'
        // const firstLetter = extension.charAt(0)
        const displayName = getTruncatedFileName(file.file_name ?? 'file')

        return (
          <Box
            key={file.id ?? idx}
            onClick={() => handleFileClick(file.url ?? '')}
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
              justifyContent: 'center',
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
              {/* {firstLetter} */}
              <InsertDriveFileOutlined fontSize="small" />
            </Box>
            <Typography fontSize="small" sx={{ fontWeight: 600 }}>
              {displayName}
            </Typography>
          </Box>
        )
      })}
    </Stack>
  )
}

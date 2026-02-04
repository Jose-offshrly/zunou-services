import { Close, InsertDriveFileOutlined } from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  darken,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { truncate } from 'lodash'

export interface AttachmentFile {
  uploadId?: string
  file: File
  preview?: string
  type: 'image' | 'file'
  loading?: boolean
  fileKey?: string
  fileName: string
  fileType: string // MIME type like 'application/pdf', 'image/png', etc.
}

interface Props {
  attachmentFiles: AttachmentFile[]
  onRemoveFile?: (index: number) => void
}

export const Attachments = ({ attachmentFiles, onRemoveFile }: Props) => {
  if (attachmentFiles.length === 0) return null

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
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
      {attachmentFiles.map((item, index) => {
        // const extension = item.file.name.split('.').pop()?.toUpperCase() || 'F'
        // const firstLetter = extension.charAt(0)
        const displayName = getTruncatedFileName(item.file.name)

        return (
          <Box
            key={index}
            sx={{
              height: 60,
              opacity: item.loading ? 0.6 : 1,
              position: 'relative',
              ...(item.type === 'image'
                ? {
                    alignItems: 'center',
                    bgcolor: 'background.default',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    overflow: 'visible',
                    width: 60,
                  }
                : {
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    gap: 1,
                    overflow: 'visible',
                    px: 1.5,
                  }),
              '&:hover .close-button': {
                opacity: 1,
              },
            }}
          >
            {item.type === 'image' ? (
              <>
                <Box
                  sx={{
                    alignItems: 'center',
                    borderRadius: 1,
                    display: 'flex',
                    height: '100%',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <Box
                    alt={item.file.name}
                    component="img"
                    src={item.preview}
                    sx={{
                      height: '100%',
                      objectFit: 'cover',
                      width: '100%',
                    }}
                  />
                </Box>
                <IconButton
                  className="close-button"
                  disabled={item.loading}
                  onClick={onRemoveFile ? () => onRemoveFile(index) : undefined}
                  size="small"
                  sx={(theme) => ({
                    '&.Mui-disabled': {
                      bgcolor: 'white',
                      opacity: 1,
                    },
                    '&:hover': {
                      bgcolor: darken(theme.palette.common.white, 0.05),
                    },
                    bgcolor: 'white',
                    border: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    height: 18,
                    opacity: item.loading ? 1 : 0,
                    padding: 0,
                    position: 'absolute',
                    right: -8,
                    top: -8,
                    transition: 'opacity 0.2s',
                    width: 18,
                    zIndex: 1,
                  })}
                >
                  {item.loading ? (
                    <CircularProgress
                      size={10}
                      sx={{ color: 'primary.main' }}
                      thickness={5}
                    />
                  ) : (
                    <Close sx={{ fontSize: 14 }} />
                  )}
                </IconButton>
              </>
            ) : (
              <>
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
                <IconButton
                  className="close-button"
                  disabled={item.loading}
                  onClick={onRemoveFile ? () => onRemoveFile(index) : undefined}
                  size="small"
                  sx={(theme) => ({
                    '&.Mui-disabled': {
                      bgcolor: 'white',
                      opacity: 1,
                    },
                    '&:hover': {
                      bgcolor: darken(theme.palette.common.white, 0.05),
                    },
                    bgcolor: 'white',
                    border: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    height: 18,
                    opacity: item.loading ? 1 : 0,
                    padding: 0,
                    position: 'absolute',
                    right: -8,
                    top: -8,
                    transition: 'opacity 0.2s',
                    width: 18,
                    zIndex: 1,
                  })}
                >
                  {item.loading ? (
                    <CircularProgress
                      size={10}
                      sx={{ color: 'primary.main' }}
                      thickness={5}
                    />
                  ) : (
                    <Close sx={{ fontSize: 12 }} />
                  )}
                </IconButton>
              </>
            )}
          </Box>
        )
      })}
    </Stack>
  )
}

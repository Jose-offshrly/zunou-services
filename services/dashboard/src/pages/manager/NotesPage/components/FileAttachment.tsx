import { Delete } from '@mui/icons-material'
import { alpha, Box, LinearProgress, Stack, Typography } from '@mui/material'
import {
  File as GraphQLFile,
  NoteAttachmentInput,
} from '@zunou-graphql/core/graphql'
import { IconButton } from '@zunou-react/components/form/IconButton'
import { theme } from '@zunou-react/services/Theme'
import { formatFileSize } from '@zunou-react/utils/formatFileSize'
import { useEffect, useState } from 'react'

import { isImageFile, isImageFileName } from '../utils/fileUtils'
import { getFileIconFromAttachment } from './FileIcons'

interface FileAttachmentProps {
  selectedFile: globalThis.File | null
  uploadedAttachment: NoteAttachmentInput | null
  existingFile: GraphQLFile | null
  isUploading: boolean
  uploadProgress: number
  onRemoveFile: () => void
  uploadedFileTempUrl?: string
  originalFileName?: string
}

export const FileAttachment = ({
  selectedFile,
  uploadedAttachment,
  existingFile,
  isUploading,
  uploadProgress,
  onRemoveFile,
  uploadedFileTempUrl,
  originalFileName,
}: FileAttachmentProps) => {
  const [imageLoadError, setImageLoadError] = useState(false)

  const displayFile = selectedFile || uploadedAttachment || existingFile

  if (!displayFile) return null

  const isImage = selectedFile
    ? isImageFileName(selectedFile.name)
    : uploadedAttachment
      ? isImageFileName(originalFileName || uploadedAttachment.fileName || '')
      : existingFile
        ? isImageFile(existingFile)
        : false

  const fileName =
    selectedFile?.name ||
    originalFileName ||
    uploadedAttachment?.fileName ||
    existingFile?.file_name ||
    existingFile?.path.split('/').pop() ||
    'File'

  let fileUrl = ''
  if (selectedFile) {
    fileUrl = URL.createObjectURL(selectedFile)
  } else if (uploadedAttachment && uploadedFileTempUrl) {
    fileUrl = uploadedFileTempUrl
  } else if (existingFile) {
    fileUrl = existingFile.url || ''
  }

  const handleImageError = () => {
    setImageLoadError(true)
  }

  const handleImageLoad = () => {
    setImageLoadError(false)
  }

  useEffect(() => {
    if (
      imageLoadError &&
      (selectedFile || uploadedAttachment || existingFile)
    ) {
      setImageLoadError(false)
    }
  }, [selectedFile, uploadedAttachment, existingFile, imageLoadError])

  return (
    <Stack bgcolor={alpha(theme.palette.primary.main, 0.05)}>
      {isImage && !imageLoadError ? (
        <Box key={fileUrl} width="100%">
          {fileUrl ? (
            <Box sx={{ height: '45vh', position: 'relative', width: '100%' }}>
              <Box
                alt={fileName || 'Image'}
                component="img"
                onError={handleImageError}
                onLoad={handleImageLoad}
                src={fileUrl || ''}
                sx={{
                  borderRadius: 1,
                  height: '100%',
                  objectFit: 'contain', // Change this
                  width: '100%',
                }}
              />
              <IconButton
                onClick={onRemoveFile}
                size="small"
                sx={{
                  '&:hover': {
                    bgcolor: 'common.white',
                  },
                  bgcolor: alpha(theme.palette.common.white, 0.8),
                  bottom: 8,
                  position: 'absolute',
                  right: 8,
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Stack
              alignItems="center"
              direction="row"
              spacing={2}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Stack
                sx={{
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderBottomLeftRadius: 2,
                  borderTopLeftRadius: 2,
                  display: 'flex',
                  height: 80,
                  justifyContent: 'center',
                  p: 1,
                  width: 80,
                }}
              >
                {getFileIconFromAttachment(
                  uploadedAttachment || {
                    fileKey: existingFile?.path || '',
                    fileName: fileName,
                    type:
                      selectedFile?.type ||
                      existingFile?.type ||
                      'application/octet-stream',
                  },
                )}
              </Stack>
              <Stack
                flex={1}
                sx={{
                  borderBottomRightRadius: 2,
                  borderTopRightRadius: 2,
                }}
              >
                <Typography fontWeight={500} variant="body2">
                  {fileName}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {!isUploading &&
                    (selectedFile?.size || existingFile?.size) && (
                      <>
                        <Typography color="text.secondary" variant="caption">
                          {formatFileSize(
                            selectedFile?.size ?? existingFile?.size ?? 0,
                          )}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          {selectedFile?.type ||
                            existingFile?.type ||
                            'Unknown type'}
                        </Typography>
                      </>
                    )}
                </Stack>
                <Typography color="text.secondary" variant="caption">
                  File uploaded successfully
                </Typography>
              </Stack>
              <IconButton
                onClick={onRemoveFile}
                size="small"
                sx={{
                  '&:hover': {
                    bgcolor: 'common.white',
                  },
                  bgcolor: alpha(theme.palette.common.white, 0.8),
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Box>
      ) : (
        <Stack
          alignItems="center"
          bgcolor={alpha(theme.palette.primary.main, 0.1)}
          borderRadius={2}
          direction="row"
          overflow="hidden"
          pr={2}
          spacing={2}
          width="100%"
        >
          <Stack
            sx={{
              alignItems: 'center',
              backgroundColor: alpha(theme.palette.primary.main, 0.25),
              borderBottomLeftRadius: 8,
              borderTopLeftRadius: 8,
              height: 80,
              justifyContent: 'center',
              p: 1,
              width: 80,
            }}
          >
            {getFileIconFromAttachment(
              uploadedAttachment || {
                fileKey: existingFile?.path || '',
                fileName: fileName,
                type:
                  selectedFile?.type ||
                  existingFile?.type ||
                  'application/octet-stream',
              },
            )}
          </Stack>
          <Stack flex={1}>
            <Typography fontWeight={500} variant="body2">
              {fileName}
            </Typography>
            <Stack direction="row" spacing={1}>
              {!isUploading && (selectedFile?.size || existingFile?.size) && (
                <>
                  <Typography color="text.secondary" variant="caption">
                    {formatFileSize(
                      selectedFile?.size ?? existingFile?.size ?? 0,
                    )}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {selectedFile?.type || existingFile?.type || 'Unknown type'}
                  </Typography>
                </>
              )}
            </Stack>
            {imageLoadError && (
              <Typography color="error" variant="caption">
                Failed to load image
              </Typography>
            )}
          </Stack>
          <IconButton
            onClick={onRemoveFile}
            size="small"
            sx={{
              '&:hover': {
                bgcolor: 'common.white',
              },
              bgcolor: alpha(theme.palette.common.white, 0.8),
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Stack>
      )}

      {isUploading && (
        <Stack sx={{ borderRadius: 2, p: 1 }}>
          <LinearProgress
            sx={{ borderRadius: 2, height: 4 }}
            value={uploadProgress}
            variant="determinate"
          />
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
            Uploading... {uploadProgress}%
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}

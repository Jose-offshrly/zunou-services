import {
  AudioFile,
  Description,
  Image,
  InsertDriveFile,
  PictureAsPdf,
  VideoFile,
} from '@mui/icons-material'
import { alpha } from '@mui/material'
import { File, NoteAttachmentInput } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

/**
 * Get the appropriate icon for a file based on its extension
 * @param file - The file object
 * @returns JSX element representing the file icon
 */
export const getFileIcon = (file: File) => {
  const extension = (file.file_name || file.path)
    .split('.')
    .pop()
    ?.toLowerCase()

  switch (extension) {
    case 'pdf':
      return (
        <PictureAsPdf
          sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
        />
      )
    case 'doc':
    case 'docx':
    case 'txt':
    case 'rtf':
    case 'md':
    case 'markdown':
      return (
        <Description
          sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
        />
      )
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return (
        <VideoFile
          sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
        />
      )
    case 'mp3':
    case 'wav':
    case 'aac':
      return (
        <AudioFile
          sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
        />
      )
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return (
        <Image
          sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
        />
      )
    default:
      return (
        <InsertDriveFile
          sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
        />
      )
  }
}

/**
 * Get the appropriate icon for a file attachment based on its file name
 * @param attachment - The file attachment object
 * @returns JSX element representing the file icon
 */
export const getFileIconFromAttachment = (
  attachment: NoteAttachmentInput | null,
) => {
  if (!attachment || !attachment.fileName) {
    return (
      <InsertDriveFile
        sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
      />
    )
  }

  const extension = attachment.fileName.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'pdf':
      return (
        <PictureAsPdf
          sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
        />
      )
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return (
        <Image
          sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
        />
      )
    default:
      return (
        <InsertDriveFile
          sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: 20 }}
        />
      )
  }
}

import { getFileType } from '@zunou-react/services/File'
import { useCallback } from 'react'
import toast from 'react-hot-toast'

import { AttachmentFile } from '~/components/ui/form/SlateInput/attachments'
import { useMultipleS3Upload } from '~/hooks/useMultipleS3Upload'
import { usePulseStore } from '~/store/usePulseStore'

import { ChatType } from '../components/ChatMessage'

interface Props {
  pulseId?: string
  pulseAction?: {
    teamChatAttachments?: AttachmentFile[]
    miniPulseChatAttachments?: AttachmentFile[]
  }
  maxFiles?: number
  maxFileSize?: number
  type: ChatType
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10mb
const DEFAULT_MAX_FILES = 5

export const useTeamChatFileAttachments = ({
  pulseId,
  pulseAction,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  type,
}: Props) => {
  const { addActionToPulse } = usePulseStore()

  // Determine which attachment property to use based on type
  const attachmentKey =
    type === 'MINI_PULSE_CHAT'
      ? 'miniPulseChatAttachments'
      : 'teamChatAttachments'

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      const extension = file.name.split('.').pop()?.toLowerCase()

      if (!extension) {
        return { error: 'File has no extension', valid: false }
      }

      // Check file size
      if (file.size > maxFileSize) {
        const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(0)
        return {
          error: `${file.name}'s size exceeds the ${sizeMB}MB limit`,
          valid: false,
        }
      }

      try {
        // If getFileType doesn't throw an error, the file type is valid
        getFileType(extension)
        return { valid: true }
      } catch (error) {
        return {
          error: `File type .${extension} is not supported. Please upload a valid document, image, or video file.`,
          valid: false,
        }
      }
    },
    [maxFileSize],
  )

  const {
    uploadFiles,
    uploads,
    isUploading: isUploadingFiles,
  } = useMultipleS3Upload({
    onUploadComplete: (uploadId, result) => {
      if (!pulseId) return

      // Update ONLY the file that matches this uploadId
      addActionToPulse({
        id: pulseId,
        updates: (currentAction) => {
          const currentAttachments = currentAction[attachmentKey] || []
          const updatedAttachments = currentAttachments.map((attachment) => {
            // Only update the attachment with matching uploadId
            if (attachment.uploadId === uploadId) {
              return {
                ...attachment,
                fileKey: result.fileKey,
                loading: false,
                preview: result.fileTempUrl,
              }
            }
            // Return other attachments unchanged
            return attachment
          })

          return {
            [attachmentKey]: updatedAttachments,
          }
        },
      })
    },
    onUploadError: (uploadId, error, file) => {
      console.error(`Upload error for ${uploadId}:`, error)
      toast.error(`Failed to upload ${file.name}`)

      if (!pulseId) return

      // Remove the failed file from state
      addActionToPulse({
        id: pulseId,
        updates: (currentAction) => {
          const currentAttachments = currentAction[attachmentKey] || []
          const updatedAttachments = currentAttachments.filter(
            (attachment) => attachment.uploadId !== uploadId,
          )

          return {
            [attachmentKey]: updatedAttachments,
          }
        },
      })
    },
  })

  const processAndUploadFiles = useCallback(
    (files: File[], type: 'image' | 'file') => {
      if (!pulseId) {
        toast.error('Missing Pulse ID.')
        return
      }

      const currentAttachments = pulseAction?.[attachmentKey] || []
      const currentAttachmentCount = currentAttachments.length
      const availableSlots = maxFiles - currentAttachmentCount

      // Check if adding these files would exceed the limit
      if (files.length > availableSlots) {
        toast.error(
          `Upload limit reached. You can attach up to ${maxFiles} file${maxFiles !== 1 ? 's' : ''}.`,
        )
        return
      }

      // Validate all files first
      const validationResults = files.map((file) => ({
        file,
        validation: validateFile(file),
      }))

      // Filter out invalid files and show errors
      const invalidFiles = validationResults.filter((r) => !r.validation.valid)
      const validFiles = validationResults
        .filter((r) => r.validation.valid)
        .map((r) => r.file)

      // Show errors for invalid files
      invalidFiles.forEach(({ file, validation }) => {
        toast.error(validation.error || `${file.name} is not a valid file type`)
      })

      // If no valid files, return early
      if (validFiles.length === 0) {
        return
      }

      // Create attachment objects with uploadIds for valid files only
      const newFiles: (AttachmentFile & { uploadId: string })[] =
        validFiles.map((file) => {
          const uploadId = `${file.name}-${Date.now()}-${Math.random()}`
          const isImage = type === 'image' || file.type.startsWith('image/')

          return {
            file,
            fileName: file.name,
            fileType: file.type,
            loading: true,
            type: isImage ? ('image' as const) : ('file' as const),
            uploadId,
            uploadProgress: 0,
            ...(isImage ? { preview: URL.createObjectURL(file) } : {}),
          }
        })

      // Add files to store with uploadIds
      addActionToPulse({
        id: pulseId,
        updates: {
          [attachmentKey]: [...currentAttachments, ...newFiles],
        },
      })

      const uploadIds = newFiles.map((f) => f.uploadId)
      uploadFiles(validFiles, uploadIds)
    },
    [
      pulseId,
      pulseAction,
      attachmentKey,
      maxFiles,
      validateFile,
      uploadFiles,
      addActionToPulse,
    ],
  )

  const handleFileUpload = useCallback(
    (files: File[]) => {
      processAndUploadFiles(files, 'file')
    },
    [processAndUploadFiles],
  )

  const handleImageUpload = useCallback(
    (files: File[]) => {
      processAndUploadFiles(files, 'image')
    },
    [processAndUploadFiles],
  )

  const handleRemoveFile = useCallback(
    (index: number) => {
      if (!pulseId) {
        toast.error('Missing Pulse ID.')
        return
      }

      const currentAttachments = pulseAction?.[attachmentKey] || []
      const updatedAttachments = currentAttachments.filter(
        (_, i) => i !== index,
      )

      addActionToPulse({
        id: pulseId,
        updates: {
          [attachmentKey]: updatedAttachments,
        },
      })
    },
    [pulseId, pulseAction, attachmentKey, addActionToPulse],
  )

  return {
    handleFileUpload,
    handleImageUpload,
    handleRemoveFile,
    isUploadingFiles,
    uploads,
  }
}

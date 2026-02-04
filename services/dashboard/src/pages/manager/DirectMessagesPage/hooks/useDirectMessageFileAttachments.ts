import { getFileType } from '@zunou-react/services/File'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

import { AttachmentFile } from '~/components/ui/form/SlateInput/attachments'
import { useMultipleS3Upload } from '~/hooks/useMultipleS3Upload'

interface Props {
  maxFiles?: number
  maxFileSize?: number
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10mb
const DEFAULT_MAX_FILES = 5

export const useDirectMessageFileAttachments = ({
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
}: Props = {}) => {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])

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
      // Update ONLY the file that matches this uploadId
      setAttachments((prev) =>
        prev.map((attachment) => {
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
        }),
      )
    },
    onUploadError: (uploadId, error, file) => {
      console.error(`Upload error for ${uploadId}:`, error)
      toast.error(`Failed to upload ${file.name}`)

      // Remove the failed file from state
      setAttachments((prev) =>
        prev.filter((attachment) => attachment.uploadId !== uploadId),
      )
    },
  })

  const processAndUploadFiles = useCallback(
    (files: File[], type: 'image' | 'file') => {
      const currentAttachmentCount = attachments.length
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

      // Add files to state with uploadIds
      setAttachments((prev) => [...prev, ...newFiles])

      const uploadIds = newFiles.map((f) => f.uploadId)
      uploadFiles(validFiles, uploadIds)
    },
    [attachments, maxFiles, validateFile, uploadFiles],
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

  const handleRemoveFile = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearAttachments = useCallback(() => {
    setAttachments([])
  }, [])

  return {
    attachments,
    clearAttachments,
    handleFileUpload,
    handleImageUpload,
    handleRemoveFile,
    isUploadingFiles,
    uploads,
  }
}

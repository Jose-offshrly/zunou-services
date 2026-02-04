import { NoteAttachmentInput, UploadType } from '@zunou-graphql/core/graphql'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useS3Upload } from '~/hooks/useS3Upload'

import { NoteAttachmentInputWithTempUrl } from '../..'

interface GraphQLFile {
  id: string
  fileName: string
  fileKey: string
  type: string
}

interface UseFileHandlingProps {
  onFileChange?: (attachments: NoteAttachmentInputWithTempUrl[]) => void
  existingFile?: GraphQLFile
  onRemoveExistingFile?: (fileId: string) => void
}

export const useFileHandling = ({
  onFileChange,
  existingFile,
  onRemoveExistingFile,
}: UseFileHandlingProps) => {
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null)
  const [uploadedAttachment, setUploadedAttachment] =
    useState<NoteAttachmentInput | null>(null)
  const [uploadedFileTempUrl, setUploadedFileTempUrl] = useState<string>('')
  const [originalFileName, setOriginalFileName] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [hasExistingFile, setHasExistingFile] = useState(!!existingFile)
  const [existingFileRemoved, setExistingFileRemoved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHasExistingFile(!!existingFile)
    if (existingFile) {
      setExistingFileRemoved(false)
    }
  }, [!!existingFile])

  const { uploadFile, isUploading, uploadProgress } = useS3Upload({
    onUploadComplete: (result) => {
      const attachment: NoteAttachmentInputWithTempUrl = {
        fileKey: result.fileKey,
        fileName: result.fileName,
        tempUrl: result.fileTempUrl,
        type: result.originalFile.type,
      }
      setUploadedAttachment(attachment)
      setUploadedFileTempUrl(result.fileTempUrl)
      setOriginalFileName(result.fileName)
      setSelectedFile(null)
      setHasExistingFile(false)
      if (onFileChange) {
        onFileChange([attachment])
      }
    },
    onUploadError: (error) => {
      console.error('Upload error:', error)
      setSelectedFile(null)
      setUploadedFileTempUrl('')
      setOriginalFileName('')
    },
    uploadType: UploadType.Asset,
  })

  const handleFileSelect = useCallback(
    (file: globalThis.File) => {
      if (file) {
        setSelectedFile(file)
        setUploadedAttachment(null)
        setUploadedFileTempUrl('')
        setOriginalFileName('')
        setHasExistingFile(false)
        uploadFile(file)
      }
    },
    [uploadFile],
  )

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    if (hasExistingFile && onRemoveExistingFile && existingFile?.id) {
      setExistingFileRemoved(true)
      onRemoveExistingFile(existingFile.id)
    }

    setSelectedFile(null)
    setUploadedAttachment(null)
    setUploadedFileTempUrl('')
    setOriginalFileName('')
    setHasExistingFile(false)
    if (onFileChange) {
      onFileChange([])
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        setSelectedFile(files[0])
        setUploadedAttachment(null)
        setUploadedFileTempUrl('')
        setOriginalFileName('')
        setHasExistingFile(false)
        uploadFile(files[0])
      }
    },
    [uploadFile],
  )

  return {
    existingFileRemoved,
    fileInputRef,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileButtonClick,
    handleFileInputChange,
    handleFileSelect,
    handleRemoveFile,
    hasExistingFile,
    isDragOver,
    isUploading,
    originalFileName,
    selectedFile,
    uploadProgress,
    uploadedAttachment,
    uploadedFileTempUrl,
  }
}

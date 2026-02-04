import { useCallback, useRef, useState } from 'react'

import { UploadResult, useS3Upload, UseS3UploadOptions } from './useS3Upload'

export interface UploadProgress {
  uploadId: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  result?: UploadResult
  error?: Error
}

export interface UseMultipleS3UploadOptions
  extends Omit<
    UseS3UploadOptions,
    'onUploadStart' | 'onUploadComplete' | 'onUploadError' | 'onUploadProgress'
  > {
  onAllUploadsComplete?: (results: UploadResult[]) => void
  onUploadStart?: (uploadId: string, file: File) => void
  onUploadComplete?: (uploadId: string, result: UploadResult) => void
  onUploadError?: (uploadId: string, error: Error, file: File) => void
  onUploadProgress?: (uploadId: string, progress: number, file: File) => void
}

export const useMultipleS3Upload = (
  options: UseMultipleS3UploadOptions = {},
) => {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const uploadResultsRef = useRef<Map<string, UploadResult>>(new Map())

  const {
    onAllUploadsComplete,
    onUploadStart: onUploadStartCallback,
    onUploadComplete: onUploadCompleteCallback,
    onUploadError: onUploadErrorCallback,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    onUploadProgress: onUploadProgressCallback,
    ...s3UploadOptions
  } = options

  const { uploadFile: s3UploadFile, cleanup } = useS3Upload(s3UploadOptions)

  const updateUpload = useCallback(
    (uploadId: string, updates: Partial<UploadProgress>) => {
      setUploads((prev) => {
        const newUploads = new Map(prev)
        const existing = newUploads.get(uploadId)
        if (existing) {
          newUploads.set(uploadId, { ...existing, ...updates })
        }
        return newUploads
      })
    },
    [],
  )

  const uploadFile = useCallback(
    async (file: File, uploadId?: string): Promise<UploadResult> => {
      const id = uploadId || `${file.name}-${Date.now()}-${Math.random()}`

      // Initialize upload tracking
      setUploads((prev) => {
        const newUploads = new Map(prev)
        newUploads.set(id, {
          file,
          progress: 0,
          status: 'pending',
          uploadId: id,
        })
        return newUploads
      })

      setIsUploading(true)
      onUploadStartCallback?.(id, file)

      try {
        updateUpload(id, { status: 'uploading' })

        const result = await s3UploadFile(file)

        uploadResultsRef.current.set(id, result)
        updateUpload(id, {
          progress: 100,
          result,
          status: 'completed',
        })

        onUploadCompleteCallback?.(id, result)

        return result
      } catch (error) {
        const uploadError =
          error instanceof Error ? error : new Error('Upload failed')

        updateUpload(id, {
          error: uploadError,
          status: 'error',
        })

        onUploadErrorCallback?.(id, uploadError, file)
        throw uploadError
      } finally {
        // Check if all uploads are complete
        setUploads((prev) => {
          const hasActiveUploads = Array.from(prev.values()).some(
            (upload) =>
              upload.status === 'pending' || upload.status === 'uploading',
          )

          if (!hasActiveUploads) {
            setIsUploading(false)

            // Trigger callback with all successful results
            const results = Array.from(uploadResultsRef.current.values())
            if (results.length > 0) {
              onAllUploadsComplete?.(results)
            }
          }

          return prev
        })
      }
    },
    [
      s3UploadFile,
      updateUpload,
      onUploadStartCallback,
      onUploadCompleteCallback,
      onUploadErrorCallback,
      onAllUploadsComplete,
    ],
  )

  const uploadFiles = useCallback(
    async (files: File[], uploadIds?: string[]): Promise<UploadResult[]> => {
      const uploadPromises = files.map((file, index) => {
        // Use provided uploadId or generate new one
        const uploadId =
          uploadIds?.[index] || `${file.name}-${Date.now()}-${Math.random()}`
        return uploadFile(file, uploadId)
      })

      try {
        const results = await Promise.all(uploadPromises)
        return results
      } catch (error) {
        // Even if some uploads fail, return the successful ones
        const results = Array.from(uploadResultsRef.current.values())
        return results
      }
    },
    [uploadFile],
  )

  const cancelUpload = useCallback(
    (uploadId: string) => {
      updateUpload(uploadId, {
        error: new Error('Upload cancelled'),
        status: 'error',
      })
      uploadResultsRef.current.delete(uploadId)
    },
    [updateUpload],
  )

  const cancelAllUploads = useCallback(() => {
    setUploads((prev) => {
      const newUploads = new Map(prev)
      newUploads.forEach((upload, id) => {
        if (upload.status === 'pending' || upload.status === 'uploading') {
          newUploads.set(id, {
            ...upload,
            error: new Error('Upload cancelled'),
            status: 'error',
          })
        }
      })
      return newUploads
    })
    uploadResultsRef.current.clear()
    setIsUploading(false)
    cleanup()
  }, [cleanup])

  const reset = useCallback(() => {
    setUploads(new Map())
    uploadResultsRef.current.clear()
    setIsUploading(false)
  }, [])

  const getUpload = useCallback(
    (uploadId: string): UploadProgress | undefined => {
      return uploads.get(uploadId)
    },
    [uploads],
  )

  const getAllUploads = useCallback((): UploadProgress[] => {
    return Array.from(uploads.values())
  }, [uploads])

  const getUploadsByStatus = useCallback(
    (status: UploadProgress['status']): UploadProgress[] => {
      return Array.from(uploads.values()).filter(
        (upload) => upload.status === status,
      )
    },
    [uploads],
  )

  return {
    cancelAllUploads,
    cancelUpload,
    cleanup,
    getAllUploads,
    getUpload,
    getUploadsByStatus,
    isUploading,
    reset,
    uploadFile,
    uploadFiles,
    uploads: Array.from(uploads.values()),
  }
}

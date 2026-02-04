import AwsS3 from '@uppy/aws-s3'
import Uppy from '@uppy/core'
import { UploadType } from '@zunou-graphql/core/graphql'
import { generateUploadCredentialsMutation } from '@zunou-queries/core/mutations/generateUploadCredentialsMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { getFileType } from '@zunou-react/services/File'
import { extractS3Path } from '@zunou-react/utils/extractS3Path'
import { useCallback, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useOrganization } from '~/hooks/useOrganization'

export interface UploadResult {
  fileName: string
  fileKey: string
  fileTempUrl: string
  originalFile: File
}

export interface UseS3UploadOptions {
  uploadType?: UploadType
  onUploadStart?: (file: File) => void
  onUploadComplete?: (result: UploadResult) => void
  onUploadError?: (error: Error, file?: File) => void
  onUploadProgress?: (progress: number, file: File) => void
}

export const useS3Upload = (options: UseS3UploadOptions = {}) => {
  const { organizationId } = useOrganization()
  const { getToken } = useAuthContext()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const activeUploadsRef = useRef<Map<string, Uppy>>(new Map())
  const uploadCountRef = useRef(0)

  const {
    uploadType = UploadType.Asset,
    onUploadStart,
    onUploadComplete,
    onUploadError,
    onUploadProgress,
  } = options

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!file) {
        throw new Error('No file provided')
      }

      // Create a unique ID for this upload
      const uploadId = `${file.name}-${Date.now()}-${Math.random()}`

      // Track active uploads for global state
      uploadCountRef.current++
      if (uploadCountRef.current === 1) {
        setIsUploading(true)
        setError(null)
      }

      return new Promise((resolve, reject) => {
        const uppy = new Uppy({
          restrictions: {
            maxNumberOfFiles: 1,
          },
        }).use(AwsS3, {
          getUploadParameters: async (file) => {
            try {
              const credentialsPayload = {
                fileType: getFileType(file.extension),
                organizationId,
                uploadType,
              }

              const token = await getToken()

              const credentials = await generateUploadCredentialsMutation(
                import.meta.env.VITE_CORE_GRAPHQL_URL as string,
                token,
                credentialsPayload,
              )

              const url = credentials.generateUploadCredentials?.url
              if (!url) {
                throw new Error('Failed to get upload credentials')
              }

              return {
                method: 'PUT',
                url,
              }
            } catch (error) {
              toast.error('Error getting upload parameters.')
              console.error('Error getting upload parameters:', error)
              throw error
            }
          },
        })

        // Store this uppy instance
        activeUploadsRef.current.set(uploadId, uppy)

        uppy.on('upload-progress', (_file, progress) => {
          // Only process if this upload is still active
          if (!activeUploadsRef.current.has(uploadId)) return

          const progressPercentage = Math.round(
            (progress.bytesUploaded / progress.bytesTotal) * 100,
          )
          setUploadProgress(progressPercentage)
          onUploadProgress?.(progressPercentage, file)
        })

        uppy.on('upload', () => {
          if (!activeUploadsRef.current.has(uploadId)) return
          onUploadStart?.(file)
        })

        uppy.on('complete', (result) => {
          // Clean up this upload
          activeUploadsRef.current.delete(uploadId)
          uploadCountRef.current = Math.max(0, uploadCountRef.current - 1)

          if (uploadCountRef.current === 0) {
            setIsUploading(false)
            setUploadProgress(0)
          }

          if (result.successful.length > 0) {
            const uploadedFile = result.successful[0]
            const fileKey = extractS3Path(uploadedFile.uploadURL)
            const fileName = uploadedFile.name
            const fileTempUrl = URL.createObjectURL(uploadedFile.data)

            const uploadResult: UploadResult = {
              fileKey,
              fileName,
              fileTempUrl,
              originalFile: file,
            }

            setError(null)
            onUploadComplete?.(uploadResult)
            resolve(uploadResult)
          } else if (result.failed.length > 0) {
            const failedFile = result.failed[0]
            const error = new Error(failedFile.error || 'Upload failed')
            setError(error.message)
            onUploadError?.(error, file)
            reject(error)
          }

          // Close this uppy instance
          uppy.close()
        })

        uppy.on('upload-error', (_file, error) => {
          // Clean up this upload
          activeUploadsRef.current.delete(uploadId)
          uploadCountRef.current = Math.max(0, uploadCountRef.current - 1)

          if (uploadCountRef.current === 0) {
            setIsUploading(false)
            setUploadProgress(0)
          }

          setError(error.message || 'Upload failed')
          onUploadError?.(error, file)
          reject(error)

          // Close this uppy instance
          uppy.close()
        })

        try {
          uppy.addFile({
            data: file,
            name: file.name,
          })
          uppy.upload()
        } catch (error) {
          // Clean up on error
          activeUploadsRef.current.delete(uploadId)
          uploadCountRef.current = Math.max(0, uploadCountRef.current - 1)

          if (uploadCountRef.current === 0) {
            setIsUploading(false)
            setUploadProgress(0)
          }

          const uploadError = new Error('Failed to start upload')
          setError(uploadError.message)
          onUploadError?.(uploadError, file)
          reject(uploadError)

          uppy.close()
        }
      })
    },
    [
      organizationId,
      uploadType,
      onUploadStart,
      onUploadComplete,
      onUploadError,
      onUploadProgress,
    ],
  )

  const cancelUpload = useCallback(() => {
    // Cancel all active uploads
    activeUploadsRef.current.forEach((uppy) => {
      uppy.cancelAll()
      uppy.close()
    })
    activeUploadsRef.current.clear()
    uploadCountRef.current = 0
    setIsUploading(false)
    setUploadProgress(0)
    setError(null)
  }, [])

  const reset = useCallback(() => {
    uploadCountRef.current = 0
    setIsUploading(false)
    setUploadProgress(0)
    setError(null)
  }, [])

  const cleanup = useCallback(() => {
    // Close all active uppy instances
    activeUploadsRef.current.forEach((uppy) => {
      uppy.close()
    })
    activeUploadsRef.current.clear()
    uploadCountRef.current = 0
  }, [])

  return {
    cancelUpload,
    cleanup,
    error,
    isUploading,
    reset,
    uploadFile,
    uploadProgress,
  }
}

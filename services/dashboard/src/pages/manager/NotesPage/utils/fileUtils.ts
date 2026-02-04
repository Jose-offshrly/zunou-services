import { File, NoteAttachmentInput } from '@zunou-graphql/core/graphql'

/**
 * Check if a file is an image based on its path
 * @param file - The file object
 * @returns True if the file is an image
 */
export const isImageFile = (file: File): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const extension = (file.file_name || file.path)
    .split('.')
    .pop()
    ?.toLowerCase()
  return imageExtensions.includes(extension || '')
}

/**
 * Check if a file name represents an image
 * @param fileName - The file name
 * @returns True if the file name represents an image
 */
export const isImageFileName = (fileName: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const extension = fileName.split('.').pop()?.toLowerCase()
  return imageExtensions.includes(extension || '')
}

/**
 * Convert note files to attachment inputs for API calls
 * @param note - The note object containing files
 * @returns Array of NoteAttachmentInput objects
 */
export const convertNoteFilesToAttachments = (note: {
  files?: File[] | null
}): NoteAttachmentInput[] => {
  return (
    note.files?.map((file) => ({
      fileKey: file.path,
      fileName: file.file_name || file.path.split('/').pop() || 'file',
      type: file.type || 'application/octet-stream',
    })) || []
  )
}

/**
 * Extract file name from a file path
 * @param filePath - The file path
 * @param fallback - Fallback name if extraction fails
 * @returns The file name
 */
export const extractFileNameFromPath = (
  filePath: string,
  fallback = 'file',
): string => {
  return filePath.split('/').pop() || fallback
}

/**
 * Transform GraphQL File type to GraphQLFile interface for useFileHandling hook
 * @param file - The GraphQL File object
 * @returns GraphQLFile interface object or undefined if file is null/undefined
 */
export const transformFileToGraphQLFile = (file: File | null | undefined) => {
  if (!file) return undefined

  return {
    fileKey: file.path,
    fileName: extractFileNameFromPath(file.path),
    id: file.id,
    type:
      file.path.split('.').pop()?.toLowerCase() || 'application/octet-stream',
  }
}

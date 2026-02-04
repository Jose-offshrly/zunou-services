import { z } from 'zod'

export const directMessageSchema = z
  .object({
    files: z.instanceof(FileList).optional().nullable(),
    message: z
      .string()
      .max(1240, {
        message: 'Message must contain a maximum of 1240 characters',
      })
      .optional()
      .nullable(),
  })
  .refine((data) => data.message || (data.files && data.files.length > 0), {
    message: 'Either message or file must be provided.',
  })

export type DirectMessageInput = z.infer<typeof directMessageSchema>

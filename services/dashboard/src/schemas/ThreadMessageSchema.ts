import { z } from 'zod'

export const threadMessageSchema = z
  .object({
    files: z.instanceof(FileList).optional().nullable(),
    message: z.string().max(5000, {
      message: 'Message must contain a maximum of 5000 characters',
    }),
  })
  .refine((data) => data.message || (data.files && data.files.length > 0), {
    message: 'Either message or file must be provided.',
  })

export type ThreadMessageInput = z.infer<typeof threadMessageSchema>

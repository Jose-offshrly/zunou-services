import { z } from 'zod'

export const threadSchema = z
  .object({
    files: z.instanceof(FileList).optional().nullable(),
    message: z.string().optional().nullable(),
  })
  .refine((data) => data.message || (data.files && data.files.length > 0), {
    message: 'Either message or file must be provided.',
  })

export type ThreadParams = z.infer<typeof threadSchema>

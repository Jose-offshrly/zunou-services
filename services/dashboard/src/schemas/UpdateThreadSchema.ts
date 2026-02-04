import { z } from 'zod'

export const updateThreadSchema = z.object({
  name: z.string(),
})

export type UpdateThreadParams = z.infer<typeof updateThreadSchema>

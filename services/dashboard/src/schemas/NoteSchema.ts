import { z } from 'zod'

export const noteSchema = z.object({
  description: z.string().optional(),
  isPinned: z.boolean().default(false),
  labels: z.array(z.string()).default([]),
  title: z.string().min(1, 'Note title is required'),
})

export type NoteFormData = z.infer<typeof noteSchema>

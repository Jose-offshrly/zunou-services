import { z } from 'zod'

export const updateTaskListSchema = z.object({
  description: z.string().optional(),
  title: z.string().min(1, 'Task title is required'),
})

export type UpdateTaskListParams = z.infer<typeof updateTaskListSchema>

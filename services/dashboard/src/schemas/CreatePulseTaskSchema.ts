import { TaskPriority, TaskStatus, TaskType } from '@zunou-graphql/core/graphql'
import { z } from 'zod'

import { sanitizeContent } from '../utils/textUtils'

export const createTaskSchema = z.object({
  assignees: z.array(z.string()).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  parentId: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional().nullable(),
  taskType: z.nativeEnum(TaskType).optional(),
  title: z
    .string()
    .min(1)
    .max(255, { message: 'Title must contain at most 255 characters' })
    .transform((val) => sanitizeContent(val))
    .refine((val) => val.length > 0, {
      message: 'Title is required',
    }),
})
export type CreateTaskParams = z.infer<typeof createTaskSchema>

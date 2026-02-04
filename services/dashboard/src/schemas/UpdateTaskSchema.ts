import { TaskPriority, TaskStatus } from '@zunou-graphql/core/graphql'
import { z } from 'zod'

import { sanitizeContent } from '../utils/textUtils'

export const updateTaskSchema = z.object({
  assignees: z.array(z.string()),
  color: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  parentId: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  progress: z.string().optional(),
  startDate: z.string().optional(),
  status: z.union([z.nativeEnum(TaskStatus), z.string()]).optional(),
  title: z
    .string()
    .transform((val) => sanitizeContent(val))
    .refine((val) => val.length > 0, {
      message: 'Title is required',
    }),
})

export type UpdateTaskParams = z.infer<typeof updateTaskSchema>

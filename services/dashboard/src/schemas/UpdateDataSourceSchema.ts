import { z } from 'zod'

export const updateDataSourceSchema = z.object({
  description: z
    .string()
    .max(5000, {
      message: 'Description must contain a maximum of 5000 characters',
    })
    .optional()
    .nullable(),
  name: z
    .string()
    .min(1)
    .max(250, { message: 'Name must contain a maximum of 250 characters' }),
  summary: z
    .string()
    .max(5000, {
      message: 'Description must contain a maximum of 5000 characters',
    })
    .optional()
    .nullable(),
})

export type UpdateDataSourceParams = z.infer<typeof updateDataSourceSchema>

import { z } from 'zod'

export const createDataSourceSchema = z.object({
  description: z
    .string()
    .max(5000, {
      message: 'Description must contain a maximum of 5000 characters',
    })
    .optional()
    .nullable(),
  fileKey: z.string({
    invalid_type_error: 'Invalid file format',
    required_error: 'File is required',
  }),
  name: z
    .string()
    .min(1)
    .max(250, { message: 'Name must contain a maximum of 250 characters' }),
})

export type CreateDataSourceParams = z.infer<typeof createDataSourceSchema>

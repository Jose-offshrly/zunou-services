import { z } from 'zod'

export const updateAiAgentSchema = z.object({
  credentials: z
    .record(z.string())
    .refine(
      (creds) => Object.values(creds).every((value) => value.trim() !== ''),
      { message: 'Credentials cannot be empty' },
    ),
  description: z
    .string()
    .max(500, {
      message: 'Description must contain a maximum of 500 characters',
    })
    .optional()
    .nullable(),
  guidelines: z
    .string()
    .max(5000, {
      message: 'Guidelines must contain a maximum of 5000 characters',
    })
    .optional()
    .nullable(),
  name: z
    .string()
    .min(1)
    .max(250, { message: 'Name must contain a maximum of 250 characters' }),
})

export type UpdateAiAgentParams = z.infer<typeof updateAiAgentSchema>

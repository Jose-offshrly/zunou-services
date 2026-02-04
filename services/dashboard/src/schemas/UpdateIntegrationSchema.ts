import { z } from 'zod'

export const updateIntegrationSchema = z.object({
  apiKey: z
    .string()
    .min(32, 'API key is too short. It should be at least 32 characters long.')
    .max(128, 'API key is too long. It should be at most 128 characters long.')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'API key contains invalid characters. It should only contain letters, numbers, dashes, or underscores.',
    ),
})

export type UpdateIntegrationParams = z.infer<typeof updateIntegrationSchema>

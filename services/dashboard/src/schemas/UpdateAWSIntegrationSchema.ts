import { z } from 'zod'

export const updateAWSIntegrationSchema = z.object({
  apiKey: z
    .string()
    .min(20, 'API key is too short. It should be at least 20 characters long.')
    .max(20, 'API key is too long. It should be at most 20 characters long.')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'API key contains invalid characters. It should only contain letters, numbers, dashes, or underscores.',
    ),
  secretKey: z
    .string()
    .min(8, 'Secret key is too short.') // Adjust as needed
    .max(128, 'Secret key is too long.')
    .regex(/^[a-zA-Z0-9/+=-_]+$/, 'Secret key contains invalid characters.'),
})

export type UpdateAWSIntegrationParams = z.infer<
  typeof updateAWSIntegrationSchema
>

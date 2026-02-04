import { z } from 'zod'

export const registerInterestSchema = z.object({
  companyName: z
    .string()
    .min(1)
    .max(255, 'Company name must be less than 255 characters'),
  companySize: z
    .string()
    .max(255, 'Company size must be less than 255 characters'),
  email: z.string().email('Invalid email address'),
  lookingFor: z
    .string()
    .max(255, 'Looking for must be less than 255 characters')
    .optional()
    .nullable(),
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255)
    .refine((value) => value.toLowerCase() !== 'pulse', {
      message:
        'The name "pulse" is not allowed. Please choose a different name.',
    }),
})

export type RegisterInterestParams = z.infer<typeof registerInterestSchema>

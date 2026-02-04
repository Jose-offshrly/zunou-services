import { z } from '~/libs/zod'

export const updateOrganizationUserSchema = z.object({
  department: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .refine((value) => value.toLowerCase() !== 'pulse' && value !== 'Pulse', {
      message:
        'The name "pulse/Pulse" is not allowed. Please choose a different name.',
    }),
  profile: z.string().optional().nullable(),
  timezone: z.string().optional(),
})

export type UpdateOrganizationUserParams = z.infer<
  typeof updateOrganizationUserSchema
>

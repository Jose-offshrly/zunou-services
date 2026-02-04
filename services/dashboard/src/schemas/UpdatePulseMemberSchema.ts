import { z } from '~/libs/zod'

export const updatePulseMemberSchema = z.object({
  jobDescription: z.string().min(1, 'Job description is required'),
  jobTitle: z.string().optional(),
  organizationUserId: z.string(),
  profile: z.string().optional(),
  responsibilities: z
    .array(z.string())
    .min(1, 'At least one responsibility is required'),
})

export type UpdatePulseMemberParams = z.infer<typeof updatePulseMemberSchema>

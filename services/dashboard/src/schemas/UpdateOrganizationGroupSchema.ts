import { z } from '~/libs/zod'

export const updateOrganizationGroupSchema = z.object({
  description: z
    .string()
    .min(1, 'Group description is required')
    .max(255, 'Group description cannot exceed 255 characters'),
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(64, 'Group name cannot exceed 64 characters'),
  organizationGroupId: z.string(),
})

export type UpdateOrganizationGroupParams = z.infer<
  typeof updateOrganizationGroupSchema
>

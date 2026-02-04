import { z } from '~/libs/zod'

export const updateOrganizationSchema = z.object({
  description: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  fileKey: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
})

export type UpdateOrganizationParams = z.infer<typeof updateOrganizationSchema>

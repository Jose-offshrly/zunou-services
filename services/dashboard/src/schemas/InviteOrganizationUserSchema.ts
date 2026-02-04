import { OrganizationUserRole } from '@zunou-graphql/core/graphql'

import { z } from '~/libs/zod'

const inviteUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().refine((value) => value.toLowerCase() !== 'pulse', {
    message: 'The name "pulse" is not allowed. Please choose a different name.',
  }),
  organizationId: z.string(),
  role: z.nativeEnum(OrganizationUserRole),
})

export const inviteUsersSchema = z.object({
  input: z.array(inviteUserInputSchema),
})
export type InviteUsersParams = z.infer<typeof inviteUsersSchema>

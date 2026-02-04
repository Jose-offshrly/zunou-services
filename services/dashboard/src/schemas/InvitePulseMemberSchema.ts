import { PulseGuestRole } from '@zunou-graphql/core/graphql'

import { z } from '~/libs/zod'

const invitePulseMemberInputSchema = z.object({
  role: z.nativeEnum(PulseGuestRole),
  userId: z.string(),
})

export const invitePulseMemberSchema = z.object({
  input: z.array(invitePulseMemberInputSchema),
})
export type InvitePulseMemberParams = z.infer<typeof invitePulseMemberSchema>

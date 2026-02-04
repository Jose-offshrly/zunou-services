import { PulseType } from '@zunou-graphql/core/graphql'

import { z } from '~/libs/zod'

export const updatePulseSchema = z.object({
  description: z.string(),
  icon: z.nativeEnum(PulseType).optional().nullable(),
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Maxium of 100 characters.' }),
})

export type UpdatePulseParams = z.infer<typeof updatePulseSchema>

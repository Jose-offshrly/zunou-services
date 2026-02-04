import { z } from 'zod'

export const customPulseFormSchema = z.object({
  description: z.string(),
  name: z.string().max(100, { message: 'Pulse cannot exceed 100 characters' }),
})

export type CustomPulseFormParams = z.infer<typeof customPulseFormSchema>

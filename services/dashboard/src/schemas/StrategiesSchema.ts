import { z } from 'zod'

export const strategyFormSchema = z.object({
  description: z
    .string()
    .min(1, {
      message: 'Description is required',
    })
    .max(5000, {
      message: 'Description must contain a maximum of 5000 characters',
    }),
  name: z
    .string()
    .min(1)
    .max(250, { message: 'Name must contain a maximum of 250 characters' }),
  prompt_description: z.string().optional(),
})

export type StrategyFormData = z.infer<typeof strategyFormSchema>

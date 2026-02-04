import { z } from '../libs/zod'

export const updateMessageSchema = z.object({
  message: z.string().min(1).max(5000, {
    message: 'Message must contain a maximum of 5000 characters',
  }),
})

export type UpdateMessageInput = z.infer<typeof updateMessageSchema>

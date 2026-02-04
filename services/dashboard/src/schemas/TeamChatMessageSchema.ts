import { z } from 'zod'

export const TeamChatMessageSchema = z.object({
  message: z.any(),
})

export type TeamChatMessageInput = z.infer<typeof TeamChatMessageSchema>

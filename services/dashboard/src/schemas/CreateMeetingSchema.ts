import { z } from 'zod'

const metadataSchema = z.object({
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
})

export const createMeetingSchema = z
  .object({
    metadata: metadataSchema.optional(),
    participants: z
      .string()
      .min(1, { message: 'Participants is required' })
      .refine(
        (val) => {
          // Split by comma and validate each email
          const emails = val.split(',').map((email) => email.trim())
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return emails.every((email) => emailRegex.test(email))
        },
        { message: 'Participants must be valid comma-separated emails' },
      ),
    pulseId: z.string().min(1, { message: 'Pulse ID is required' }),
    title: z
      .string()
      .min(1, { message: 'Title is required' })
      .max(250, { message: 'Title must contain a maximum of 250 characters' }),
    transcript: z.string().optional(),
  })
  .refine((data) => data.transcript || data.metadata, {
    message: 'Either transcript or metadata is required',
    path: ['transcript'],
  })

export type CreateMeetingParams = z.infer<typeof createMeetingSchema>

import { z } from 'zod'

export const linkGoogleCalendarSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  useDefault: z.boolean(),
})

export type LinkGoogleCalendarParams = z.infer<typeof linkGoogleCalendarSchema>

import { z } from 'zod'

export const updateTimesheetSchema = z.object({
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
})

export type UpdateTimesheetParams = z.infer<typeof updateTimesheetSchema>

import { z } from 'zod'

export const createPulseSchema = z.object({
  automations: z
    .array(
      z.object({
        createdAt: z.string().optional(),
        description: z.string(),
        id: z.string().optional(),
        name: z.string(),
        organizationId: z.string(),
        pulseId: z.string().optional(),
        type: z.string(),
        updatedAt: z.string().optional(),
      }),
    )
    .optional(),
  companyName: z
    .string()
    .min(1, { message: 'Pulse name is required' })
    .max(100, { message: 'Pulse cannot exceed 100 characters' }),
  missionText: z.string().optional(),
  missions: z
    .array(
      z.object({
        createdAt: z.string().optional(),
        description: z.string(),
        id: z.string().optional(),
        name: z.string(),
        organizationId: z.string(),
        pulseId: z.string().optional(),
        type: z.string(),
        updatedAt: z.string().optional(),
      }),
    )
    .optional(),
})

export type CreatePulseParams = z.infer<typeof createPulseSchema>

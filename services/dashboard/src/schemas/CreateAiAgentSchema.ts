import { AiAgentType } from '@zunou-graphql/core/graphql'
import { z } from 'zod'

export const createAiAgentSchema = z
  .object({
    agentType: z.nativeEnum(AiAgentType),
    credentials: z
      .record(z.string())
      .refine(
        (creds) => Object.values(creds).every((value) => value.trim() !== ''),
        { message: 'Credentials cannot be empty' },
      ),
    description: z
      .string()
      .max(500, {
        message: 'Description must contain a maximum of 500 characters',
      })
      .optional()
      .nullable(),
    guidelines: z
      .string()
      .max(5000, {
        message: 'Guidelines must contain a maximum of 5000 characters',
      })
      .optional()
      .nullable(),
    name: z
      .string()
      .min(1)
      .max(250, { message: 'Name must contain a maximum of 250 characters' }),
  })
  .refine(
    (data) => {
      const { agentType, credentials } = data
      const credKeys = Object.keys(credentials)

      switch (agentType) {
        case AiAgentType.Github:
        case AiAgentType.Slack:
        case AiAgentType.Jira:
          return credKeys.includes('key') && credKeys.includes('workspace')
        default:
          return true // Allow other agent types to pass through
      }
    },
    {
      message: 'Invalid credentials for the selected agent type',
      path: ['credentials'],
    },
  )

export type CreateAiAgentParams = z.infer<typeof createAiAgentSchema>

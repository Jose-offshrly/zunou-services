import { AiAgentType } from '@zunou-graphql/core/graphql'

import { AgentFormData } from '../context/AgentContext'

export const aiAgents: AgentFormData[] = [
  {
    agentType: AiAgentType.Github,
    description:
      'Github is a platform for hosting and collaborating on code repositories.',
    name: 'Github',
  },
  {
    agentType: AiAgentType.Slack,
    description:
      'Slack is a messaging platform for team communication and collaboration.',
    name: 'Slack',
  },
  {
    agentType: AiAgentType.Jira,
    description:
      'Jira is a project management tool for tracking issues, tasks, and team workflows.',
    name: 'Jira',
  },
]

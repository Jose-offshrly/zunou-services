import { FilterAltOutlined } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useDeleteAiAgentMutation } from '@zunou-queries/core/hooks/useDeleteAiAgentMutation'
import { useGetAiAgentsQuery } from '@zunou-queries/core/hooks/useGetAiAgentsQuery'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'

import { SearchBar } from '../SearchBar'
import { AgentList } from './AgentList'
import { FilterSelector } from './FilterSelector'

interface Props {
  onAgentClick: () => void
}

export const AgentsTab = ({ onAgentClick }: Props) => {
  const { t } = useTranslation(['common', 'agent'])
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: aiAgentsData, isLoading: isLoadingAiAgents } =
    useGetAiAgentsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId,
        pulseId,
      },
    })
  const aiAgents = aiAgentsData?.aiAgents ?? []

  const { mutate: deleteAiAgent } = useDeleteAiAgentMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleRemoveAgent = (id: string) => {
    deleteAiAgent(
      {
        aiAgentId: id,
      },
      {
        onError: (error) => {
          toast.error(t('delete_agent_error', { ns: 'agent' }))
          console.error('Error deleting agent:', error)
        },
        onSuccess: () => {
          toast.success(t('delete_agent_success', { ns: 'agent' }))
        },
      },
    )
  }

  return (
    <Stack flex={1} minHeight={0} spacing={1.5}>
      <Stack direction="row" spacing={1}>
        <SearchBar
          onSearchChange={setSearchTerm}
          placeholder={t('search_ai_agents', { ns: 'agent' })}
          searchTerm={searchTerm}
        />
        <Stack alignItems="center" direction="row" spacing={1}>
          <FilterAltOutlined />
          <Typography>{t('filter')}</Typography>
          <FilterSelector value="all" />
        </Stack>
      </Stack>
      {/* AI Agents List */}
      <AgentList
        agents={aiAgents}
        isLoading={isLoadingAiAgents}
        onAgentClick={onAgentClick}
        onAgentRemove={handleRemoveAgent}
      />
    </Stack>
  )
}

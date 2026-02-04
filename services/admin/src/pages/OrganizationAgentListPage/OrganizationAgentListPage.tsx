import { withAuthenticationRequired } from '@auth0/auth0-react'
import AddIcon from '@mui/icons-material/Add'
import { Container } from '@mui/material'
import { useGetAgentsQuery } from '@zunou-queries/core/hooks/useGetAgentsQuery'
import { useGetOrganizationQuery } from '@zunou-queries/core/hooks/useGetOrganizationQuery'
import { PageContent, PageHeading } from '@zunou-react/components/layout'
import { Pagination } from '@zunou-react/components/navigation'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { AgentList } from '~/components/domain/agent'
import { Routes } from '~/services/Routes'

const OrganizationAgentListPage = () => {
  const { organizationId } = useParams() as { organizationId: string }
  const { useTrackQuery } = useLoadingContext()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState<string | undefined>()

  const {
    data: organizationData,
    error: getError,
    isLoading: isPendingOrganisation,
  } = useGetOrganizationQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
    },
  })
  useTrackQuery(
    `${Routes.OrganizationAgentList}:organization`,
    isPendingOrganisation,
  )

  const {
    data,
    error: loadingError,
    isLoading,
  } = useGetAgentsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { name: query ? `%${query}%` : undefined, organizationId, page },
  })
  useTrackQuery(`${Routes.OrganizationAgentList}:agents`, isLoading)

  const error = getError || loadingError

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[
          {
            Icon: AddIcon,
            href: pathFor({
              pathname: Routes.OrganizationAgentNew,
              query: { organizationId },
            }),
            label: 'New Agent',
          },
        ]}
        breadcrumbs={[
          {
            href: pathFor({
              pathname: Routes.OrganizationList,
            }),
            label: 'Organizations',
          },
          {
            href: pathFor({
              pathname: Routes.OrganizationShow,
              query: { organizationId },
            }),
            label: organizationData?.organization.name || '...',
          },
          {
            href: pathFor({
              pathname: Routes.OrganizationAgentList,
              query: { organizationId },
            }),
            label: 'Agents',
          },
        ]}
      />

      <PageContent>
        <Container>
          <AgentList
            agents={data?.agents.data}
            isLoading={isLoading}
            setQuery={setQuery}
          />

          <Pagination
            page={page}
            paginatorInfo={data?.agents.paginatorInfo}
            setPage={setPage}
          />
        </Container>
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(OrganizationAgentListPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

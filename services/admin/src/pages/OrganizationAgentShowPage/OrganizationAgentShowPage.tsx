import { withAuthenticationRequired } from '@auth0/auth0-react'
import EditIcon from '@mui/icons-material/Edit'
import { Container, Table, TableBody } from '@mui/material'
import { useGetAgentQuery } from '@zunou-queries/core/hooks/useGetAgentQuery'
import { useGetOrganizationQuery } from '@zunou-queries/core/hooks/useGetOrganizationQuery'
import {
  Card,
  CardHeader,
  PageContent,
  PageHeading,
  TableCell,
  TableContainer,
  TableRow,
} from '@zunou-react/components/layout'
import { ErrorHandler, RelativeTime } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useParams } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const AgentShowPage = () => {
  const { agentId, organizationId } = useParams()
  const { useTrackQuery } = useLoadingContext()

  const {
    data: organizationData,
    error: getorganizationError,
    isLoading: isLoadingOrganization,
  } = useGetOrganizationQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
    },
  })
  useTrackQuery(
    `${Routes.OrganizationAgentList}:organization`,
    isLoadingOrganization,
  )

  const {
    data: agentData,
    error: getAgentError,
    isLoading,
  } = useGetAgentQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      agentId,
      organizationId,
    },
  })
  useTrackQuery(`${Routes.OrganizationAgentShow}:agent`, isLoading)

  const error = getAgentError || getorganizationError

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[
          {
            Icon: EditIcon,
            href: pathFor({
              pathname: Routes.OrganizationAgentEdit,
              query: { agentId, organizationId },
            }),
            label: 'Edit Agent',
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
          {
            href: pathFor({
              pathname: Routes.OrganizationAgentEdit,
              query: { agentId, organizationId },
            }),
            label: agentData?.agent.name || '...',
          },
        ]}
      />

      <PageContent>
        <Container maxWidth="sm">
          <Card>
            <CardHeader title="Agent Details" />

            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell variant="head">Name</TableCell>
                    <TableCell>{agentData?.agent?.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Prompt</TableCell>
                    <TableCell>
                      <i>{agentData?.agent?.prompt}</i>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Created</TableCell>
                    <TableCell>
                      {agentData?.agent?.createdAt ? (
                        <RelativeTime
                          time={new Date(agentData.agent.createdAt)}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Updated</TableCell>
                    <TableCell>
                      {agentData?.agent?.updatedAt ? (
                        <RelativeTime
                          time={new Date(agentData.agent.updatedAt)}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Container>
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(AgentShowPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

import { withAuthenticationRequired } from '@auth0/auth0-react'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import { Chip, Container, Table, TableBody } from '@mui/material'
import { OrganizationStatus } from '@zunou-graphql/core/graphql'
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

const OrganizationShowPage = () => {
  const { organizationId } = useParams()
  const { useTrackQuery } = useLoadingContext()

  const { data, error, isLoading } = useGetOrganizationQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
    },
  })
  useTrackQuery(`${Routes.OrganizationShow}:organization`, isLoading)

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[
          {
            Icon: PersonAddOutlinedIcon,
            href: pathFor({
              pathname: Routes.OrganizationUserList,
              query: { organizationId },
            }),
            label: 'Manage Users',
          },
          {
            Icon: SmartToyIcon,
            href: pathFor({
              pathname: Routes.OrganizationAgentList,
              query: { organizationId },
            }),
            label: 'Manage Agents',
          },
        ]}
        breadcrumbs={[
          { href: Routes.OrganizationList, label: 'Organizations' },
          {
            href: pathFor({
              pathname: Routes.OrganizationShow,
              query: { organizationId },
            }),
            label: data?.organization.name || '',
          },
        ]}
      />

      <PageContent>
        <Container maxWidth="sm">
          <Card>
            <CardHeader title="Organization Details" />

            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell variant="head">Name</TableCell>
                    <TableCell>{data?.organization?.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Status</TableCell>
                    <TableCell>
                      <Chip
                        color={
                          data?.organization?.status ===
                          OrganizationStatus.Active
                            ? 'success'
                            : 'warning'
                        }
                        label={data?.organization?.status}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Created</TableCell>
                    <TableCell>
                      {data?.organization?.createdAt ? (
                        <RelativeTime
                          time={new Date(data.organization.createdAt)}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Updated</TableCell>
                    <TableCell>
                      {data?.organization?.updatedAt ? (
                        <RelativeTime
                          time={new Date(data.organization.updatedAt)}
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

export default withAuthenticationRequired(OrganizationShowPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

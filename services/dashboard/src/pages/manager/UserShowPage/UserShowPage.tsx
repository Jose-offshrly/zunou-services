import { withAuthenticationRequired } from '@auth0/auth0-react'
import { Container, Table, TableBody } from '@mui/material'
import { useGetUserQuery } from '@zunou-queries/core/hooks/useGetUserQuery'
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
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const UserShowPage = () => {
  const { userId } = useParams()
  const { organizationId } = useOrganization()

  const { useTrackQuery } = useLoadingContext()
  const { getToken } = useAuthContext()

  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const accessToken = await getToken()
        setToken(accessToken)
      } catch (error) {
        console.error('Failed to get token:', error)
        setToken(null)
      }
    }

    fetchToken()
  }, [getToken])

  const { data, error, isLoading } = useGetUserQuery(token)
  useTrackQuery(`${Routes.UserShow}:user`, isLoading)

  // Don't render anything until we have a token
  if (token === null) {
    return <div>Loading...</div>
  }

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[]}
        breadcrumbs={[
          {
            href: pathFor({
              pathname: Routes.UserList,
              query: { organizationId },
            }),
            label: 'Users',
          },
          {
            href: pathFor({
              pathname: Routes.UserShow,
              query: { organizationId, userId },
            }),
            label: data?.name || '',
          },
        ]}
      />

      <PageContent>
        <Container maxWidth="sm">
          <Card>
            <CardHeader title="User Details" />

            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell variant="head">Name</TableCell>
                    <TableCell>{data?.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Email</TableCell>
                    <TableCell>{data?.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Created</TableCell>
                    <TableCell>
                      {data?.createdAt ? (
                        <RelativeTime time={new Date(data.createdAt)} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Updated</TableCell>
                    <TableCell>
                      {data?.updatedAt ? (
                        <RelativeTime time={new Date(data.updatedAt)} />
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

export default withAuthenticationRequired(UserShowPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

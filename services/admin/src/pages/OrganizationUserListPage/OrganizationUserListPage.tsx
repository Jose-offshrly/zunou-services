import { withAuthenticationRequired } from '@auth0/auth0-react'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import { Container } from '@mui/material'
import { useGetOrganizationQuery } from '@zunou-queries/core/hooks/useGetOrganizationQuery'
import { useGetOrganizationUsersQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersQuery'
import { PageContent, PageHeading } from '@zunou-react/components/layout'
import { Pagination } from '@zunou-react/components/navigation'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { OrganizationUserList } from '~/components/domain/organizationUser'
import { Routes } from '~/services/Routes'

const OrganizationUserListPage = () => {
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
    `${Routes.OrganizationUserList}:organization`,
    isPendingOrganisation,
  )

  const {
    data,
    error: loadingError,
    isLoading,
  } = useGetOrganizationUsersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      name: query ? `%${query}%` : undefined,
      organizationId,
      page,
    },
  })
  useTrackQuery(`${Routes.OrganizationUserList}:users`, isLoading)

  const error = getError || loadingError

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[
          {
            Icon: PersonAddOutlinedIcon,
            href: pathFor({
              pathname: Routes.OrganizationUserNew,
              query: { organizationId },
            }),
            label: 'Invite a User',
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
              pathname: Routes.OrganizationUserList,
              query: { organizationId },
            }),
            label: 'Users',
          },
        ]}
      />

      <PageContent>
        <Container>
          <OrganizationUserList
            isLoading={isLoading}
            organizationUsers={data?.organizationUsers.data}
            setQuery={setQuery}
          />

          <Pagination
            page={page}
            paginatorInfo={data?.organizationUsers.paginatorInfo}
            setPage={setPage}
          />
        </Container>
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(OrganizationUserListPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

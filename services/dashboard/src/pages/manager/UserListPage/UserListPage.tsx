import { withAuthenticationRequired } from '@auth0/auth0-react'
import AddIcon from '@mui/icons-material/Add'
import { Container } from '@mui/material'
import { useGetOrganizationUsersQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersQuery'
import { PageContent, PageHeading } from '@zunou-react/components/layout'
import { Pagination } from '@zunou-react/components/navigation'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useState } from 'react'

import { OrganizationUserList } from '~/components/domain/organizationUser'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const UserListPage = () => {
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState<string | undefined>()

  const { data, isLoading } = useGetOrganizationUsersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      name: query ? `%${query}%` : undefined,
      organizationId,
      page,
    },
  })
  useTrackQuery(`${Routes.UserList}:users`, isLoading)

  return (
    <>
      <PageHeading
        actions={[
          {
            Icon: AddIcon,
            href: pathFor({
              pathname: Routes.UserNew,
              query: { organizationId },
            }),
            label: 'Invite a User',
          },
        ]}
        breadcrumbs={[
          {
            href: pathFor({
              pathname: Routes.UserList,
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
            organizationUsers={data?.organizationUsers?.data}
            setQuery={setQuery}
          />

          <Pagination
            page={page}
            paginatorInfo={data?.organizationUsers?.paginatorInfo}
            setPage={setPage}
          />
        </Container>
      </PageContent>
    </>
  )
}

export default withAuthenticationRequired(UserListPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

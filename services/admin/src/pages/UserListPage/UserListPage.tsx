import { withAuthenticationRequired } from '@auth0/auth0-react'
import { Container } from '@mui/system'
import { useGetUsersQuery } from '@zunou-queries/core/hooks/useGetUsersQuery'
import { PageContent, PageHeading } from '@zunou-react/components/layout'
import { Pagination } from '@zunou-react/components/navigation'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { useState } from 'react'

import { UserList } from '~/components/domain/user'
import { Routes } from '~/services/Routes'

const UserListPage = () => {
  const { useTrackQuery } = useLoadingContext()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState<string | undefined>()

  const { data, error, isLoading } = useGetUsersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { name: query ? `%${query}%` : undefined, page },
  })
  useTrackQuery(`${Routes.UserList}:users`, isLoading)

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[]}
        breadcrumbs={[{ href: Routes.UserList, label: 'Users' }]}
      />

      <PageContent>
        <Container>
          <UserList
            isLoading={isLoading}
            setQuery={setQuery}
            users={data?.users.data}
          />

          <Pagination
            page={page}
            paginatorInfo={data?.users.paginatorInfo}
            setPage={setPage}
          />
        </Container>
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(UserListPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

import { withAuthenticationRequired } from '@auth0/auth0-react'
import AddIcon from '@mui/icons-material/Add'
import { Container } from '@mui/material'
import { useGetOrganizationsQuery } from '@zunou-queries/core/hooks/useGetOrganizationsQuery'
import { PageContent, PageHeading } from '@zunou-react/components/layout'
import { Pagination } from '@zunou-react/components/navigation'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { useState } from 'react'

import { OrganizationList } from '~/components/domain/organization'
import { Routes } from '~/services/Routes'

const OrganizationListPage = () => {
  const { useTrackQuery } = useLoadingContext()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState<string | undefined>()

  const { data, error, isLoading } = useGetOrganizationsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { name: query ? `%${query}%` : undefined, page },
  })
  useTrackQuery(`${Routes.OrganizationList}:organizations`, isLoading)

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[
          {
            Icon: AddIcon,
            href: Routes.OrganizationNew,
            label: 'New Organization',
          },
        ]}
        breadcrumbs={[
          { href: Routes.OrganizationList, label: 'Organizations' },
        ]}
      />

      <PageContent>
        <Container>
          <OrganizationList
            isLoading={isLoading}
            organizations={data?.organizations.data}
            setQuery={setQuery}
          />
          <Pagination
            page={page}
            paginatorInfo={data?.organizations.paginatorInfo}
            setPage={setPage}
          />
        </Container>
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(OrganizationListPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

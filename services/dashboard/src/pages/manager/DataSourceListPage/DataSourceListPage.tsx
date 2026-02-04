import { withAuthenticationRequired } from '@auth0/auth0-react'
// import { Typography } from '@mui/material' // NOTE: Removed in v0.1
import { Stack } from '@mui/system'
import { useGetDataSourcesQuery } from '@zunou-queries/core/hooks/useGetDataSourcesQuery'
import { PageContent, PageHeading } from '@zunou-react/components/layout'
import { Pagination } from '@zunou-react/components/navigation'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useEffect, useState } from 'react'

import {
  DataSourceList,
  NewDataSourceModal,
} from '~/components/domain/dataSource'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
/** NOTE: Temporarily removed for v0.1 */
// import { suggestions } from '~/libs/suggestions.json'

// The time between refreshes.
const REFRESH_INTERVAL_MILLISECONDS = 10000

const DataSourceListPage = () => {
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const { organizationId } = useOrganization()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState<string | undefined>()
  const { useTrackQuery } = useLoadingContext()

  const { data, error, isLoading, refetch } = useGetDataSourcesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      name: query ? `%${query}%` : undefined,
      organizationId,
      page,
    },
  })
  useTrackQuery(`${Routes.DataSourceList}:dataSources`, isLoading)

  // Auto-refresh the list, to get live indexing status updates.
  useEffect(() => {
    const interval = setInterval(refetch, REFRESH_INTERVAL_MILLISECONDS)
    return () => clearInterval(interval)
  }, [refetch])

  return (
    <ErrorHandler error={error}>
      <Stack flex={1}>
        <PageHeading
          actions={[
            {
              label: 'Add Data',
              onClick: () => setCsvDialogOpen(true),
            },
          ]}
          breadcrumbs={[
            {
              href: pathFor({
                pathname: Routes.DataSourceList,
                query: { organizationId },
              }),
              label: 'Manage Data Sources',
            },
          ]}
        />
        <PageContent>
          <DataSourceList
            dataSources={data?.dataSources?.data}
            isLoading={isLoading}
            setQuery={setQuery}
          />
          <Pagination
            page={page}
            paginatorInfo={data?.dataSources?.paginatorInfo}
            setPage={setPage}
          />

          <NewDataSourceModal
            isOpen={csvDialogOpen}
            onClose={() => setCsvDialogOpen(false)}
            organizationId={organizationId}
          />
        </PageContent>
      </Stack>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(DataSourceListPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

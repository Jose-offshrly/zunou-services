import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CircularProgress } from '@mui/material'
import { useGenerateDataSourceDownloadLinkMutation } from '@zunou-queries/core/hooks/useGenerateDataSourceDownloadLinkMutation'
import { CenterPageLayout } from '@zunou-react/components/layout'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const DataSourceDownloadPage = () => {
  const { dataSourceId } = useParams()
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()

  const { data, error, isPending, mutate } =
    useGenerateDataSourceDownloadLinkMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })
  useTrackQuery(`${Routes.DataSourceDownload}:generate`, isPending)

  useEffect(() => {
    if (!dataSourceId || !organizationId) {
      return
    }

    // Delay this a little to get time to load the token from local storage.
    setTimeout(() => {
      mutate({ dataSourceId, organizationId })
    }, 1000)
  }, [mutate, organizationId])

  useEffect(() => {
    if (!error && data?.generateDataSourceDownloadLink?.url) {
      window.location.href = data?.generateDataSourceDownloadLink?.url
    }
  }, [data?.generateDataSourceDownloadLink, error])

  return (
    <ErrorHandler error={error}>
      <CenterPageLayout>
        {!data || isPending ? <CircularProgress /> : null}
      </CenterPageLayout>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(DataSourceDownloadPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

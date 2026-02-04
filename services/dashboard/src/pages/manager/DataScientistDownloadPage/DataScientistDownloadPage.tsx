import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CircularProgress } from '@mui/material'
import { useGenerateDataScientistDownloadLinkMutation } from '@zunou-queries/core/hooks/useGenerateDataScientistDownloadLinkMutation'
import { CenterPageLayout } from '@zunou-react/components/layout'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const DataScientistDownloadPage = () => {
  const { filePath, '*': wildcard } = useParams()
  const { useTrackQuery } = useLoadingContext()

  const { data, error, isPending, mutate } =
    useGenerateDataScientistDownloadLinkMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })
  useTrackQuery(`${Routes.DataScientistDownload}:generate`, isPending)

  useEffect(() => {
    if (!filePath || !wildcard) {
      return
    }

    // Delay this a little to get time to load the token from local storage.
    setTimeout(() => {
      mutate({ filePath: `/files/${filePath}/${wildcard}` })
    }, 1000)
  }, [mutate, filePath, wildcard])

  useEffect(() => {
    if (!error && data?.generateDataScientistDownloadLink?.url) {
      window.location.href = data?.generateDataScientistDownloadLink?.url
    }
  }, [data?.generateDataScientistDownloadLink, error])

  return (
    <ErrorHandler error={error}>
      <CenterPageLayout>
        {!data || isPending ? <CircularProgress /> : null}
      </CenterPageLayout>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(DataScientistDownloadPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

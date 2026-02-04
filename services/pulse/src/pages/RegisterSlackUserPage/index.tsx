import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CircularProgress } from '@mui/material'
import { useUpdateMeMutation } from '@zunou-queries/core/hooks/useUpdateMeMutation'
import { CenterPageLayout } from '@zunou-react/components/layout'
import { Paragraph } from '@zunou-react/components/typography'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const RegisterSlackUserPage = () => {
  const { error: authError, isLoading: authPending, user } = useAuthContext()
  const { loading: queriesPending, useTrackQuery } = useLoadingContext()
  const { organizationId, slackId } = useParams()
  const [success, setSuccess] = useState<boolean | undefined>()

  const {
    error: updateError,
    isPending,
    mutate,
  } = useUpdateMeMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.Bootstrap}:updateUser`, isPending)

  const loading = authPending || queriesPending

  useEffect(() => {
    const perform = async () => {
      if (loading || !user || success !== undefined) {
        return
      }

      console.log('slackId', slackId)
      await mutate({ lastOrganizationId: organizationId!, slackId })
      setSuccess(true)
    }
    perform().catch((err) => {
      setSuccess(false)
      console.error(err)
    })
  }, [loading, mutate, user])

  const error = authError || updateError

  return (
    <ErrorHandler error={error}>
      <CenterPageLayout sx={{ minHeight: '100vh' }}>
        {error || success !== undefined ? null : <CircularProgress />}

        {success === true ? (
          <Paragraph>
            Thanks! Your Slack account has been linked. Please return to Slack
            and continue chatting to Pulse.
          </Paragraph>
        ) : null}

        {success === false ? (
          <Paragraph>
            Sorry, we weren&apos;t able to link your Slack account. Please
            contact Pulse support for assistance.
          </Paragraph>
        ) : null}
      </CenterPageLayout>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(RegisterSlackUserPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

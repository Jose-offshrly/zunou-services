import { withAuthenticationRequired } from '@auth0/auth0-react'
import { Box } from '@mui/material'
import { useOnboardingGenerateSlackInstallUriMutation } from '@zunou-queries/core/hooks/useOnboardingGenerateSlackInstallUriMutation'
import slackIcon from '@zunou-react/assets/images/slack-icon.png'
import slackLogo from '@zunou-react/assets/images/slack-logo.png'
import { Button } from '@zunou-react/components/form'
import {
  PagePatternPane,
  SplitPageLayout,
} from '@zunou-react/components/layout'
import { Display, Paragraph } from '@zunou-react/components/typography'
import { ErrorHandler, Image } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { OnboardingSlackButton } from '~/components/domain/onboarding/OnboardingSlackButton/OnboardingSlackButton'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const SettingsSlackPage = () => {
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()
  const navigate = useNavigate()

  const { data, error, isPending, mutate } =
    useOnboardingGenerateSlackInstallUriMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })
  useTrackQuery(`${Routes.SettingsSlack}:install`, isPending)

  const slackButtonOnClick = useCallback(() => {
    const redirectUri = `https://${window.location.host}${Routes.SettingsSlackAuthCallback}?organizationId=${organizationId}`
    mutate({ organizationId, redirectUri })
  }, [mutate, organizationId])

  const onClickReturn = useCallback(() => {
    navigate(
      pathFor({
        pathname: Routes.OrganizationBootstrap,
        query: { organizationId },
      }),
    )
  }, [navigate, organizationId])

  useEffect(() => {
    if (!error && data?.onboardingGenerateSlackInstallUri?.uri) {
      window.location.href = data?.onboardingGenerateSlackInstallUri?.uri
    }
  }, [data?.onboardingGenerateSlackInstallUri?.uri, error, organizationId])

  return (
    <ErrorHandler error={error}>
      <SplitPageLayout>
        <Box maxWidth="sm">
          <Display
            sx={{
              mb: 2,
            }}
          >
            Connect Pulse to Slack
          </Display>

          <Paragraph>
            This will allow people in your organization to interact with Pulse
            in Slack, just like if Pulse was a member of your team.
          </Paragraph>

          <Paragraph>
            You can also add Pulse to Slack channels after this step is
            completed.
          </Paragraph>

          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              mt: 5,
              width: '100%',
            }}
          >
            <OnboardingSlackButton
              iconAlt="Slack logo"
              iconSrc={slackIcon}
              loading={isPending}
              onClick={slackButtonOnClick}
            >
              Connect Pulse to Slack
            </OnboardingSlackButton>

            <Button onClick={onClickReturn} variant="text">
              Return to the Dashboard
            </Button>
          </Box>
        </Box>

        <PagePatternPane>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
            }}
          >
            <Image
              alt="Slack logo"
              height={40}
              src={slackLogo}
              style={{ width: 'auto' }}
            />
          </Box>
        </PagePatternPane>
      </SplitPageLayout>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(SettingsSlackPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

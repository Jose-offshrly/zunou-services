import { withAuthenticationRequired } from '@auth0/auth0-react'
import { Box } from '@mui/material'
import { useOnboardingGenerateSlackInstallUriMutation } from '@zunou-queries/core/hooks/useOnboardingGenerateSlackInstallUriMutation'
import chatIcon from '@zunou-react/assets/images/chat-icon.png'
import slackIcon from '@zunou-react/assets/images/slack-icon.png'
import slackLogo from '@zunou-react/assets/images/slack-logo.png'
import zunouLogo from '@zunou-react/assets/images/zunou-logo.png'
import { Button } from '@zunou-react/components/form'
import {
  PageLogoPane,
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

const OnboardingSlackPage = () => {
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()
  const navigate = useNavigate()

  const { data, error, isPending, mutate } =
    useOnboardingGenerateSlackInstallUriMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })
  useTrackQuery(`${Routes.OnboardingSlack}:install`, isPending)

  const slackButtonOnClick = useCallback(() => {
    const redirectUri = `https://${window.location.host}${Routes.OnboardingSlackAuthCallback}?organizationId=${organizationId}`
    mutate({ organizationId, redirectUri })
  }, [mutate, organizationId])

  const onboardingDataSourcesOnClick = useCallback(() => {
    navigate(
      pathFor({
        pathname: Routes.OnboardingDataSources,
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
        <PageLogoPane>
          <Box maxWidth="sm">
            <Display
              sx={{
                mb: 2,
              }}
            >
              Add Zunou to Slack
            </Display>

            <Paragraph>We&apos;re delighted to have you here.</Paragraph>

            <Paragraph>
              This will allow people in your organization to interact with Zunou
              and create requests, just like if Zunou was a member of your team.
            </Paragraph>

            <Paragraph>
              You can also add Zunou to Slack channels after this step is
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
                Add Zunou to Slack
              </OnboardingSlackButton>

              <Button onClick={onboardingDataSourcesOnClick} variant="text">
                Return to Data Sources
              </Button>
            </Box>
          </Box>
        </PageLogoPane>

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
              alt="Zunou logo"
              height={26}
              src={zunouLogo}
              style={{ width: 'auto' }}
            />

            <Image
              alt="Chat icon"
              height={48}
              src={chatIcon}
              style={{ width: 'auto' }}
            />

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

export default withAuthenticationRequired(OnboardingSlackPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

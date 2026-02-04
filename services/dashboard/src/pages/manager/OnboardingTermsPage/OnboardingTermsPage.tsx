import { withAuthenticationRequired } from '@auth0/auth0-react'
import { Box } from '@mui/material'
import { useOnboardingAgreeToTermsMutation } from '@zunou-queries/core/hooks/useOnboardingAgreeToTermsMutation'
import { LoadingButton } from '@zunou-react/components/form'
import {
  PageLogoPane,
  PagePatternPane,
  SplitPageLayout,
} from '@zunou-react/components/layout'
import { Display, Paragraph } from '@zunou-react/components/typography'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Carousel, Progress } from '~/components/domain/onboarding'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const OnboardingTermsPage = () => {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()

  const { data, error, isPending, mutate } = useOnboardingAgreeToTermsMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.OnboardingTerms}:agree`, isPending)

  const onClickNext = useCallback(() => {
    mutate({ organizationId })
  }, [mutate, organizationId])

  useEffect(() => {
    if (!error && data?.onboardingAgreeToTerms) {
      navigate(
        pathFor({
          pathname: Routes.OnboardingDataSources,
          query: { organizationId },
        }),
      )
    }
  }, [data?.onboardingAgreeToTerms, error, navigate, organizationId])

  return (
    <ErrorHandler error={error}>
      <SplitPageLayout>
        <PageLogoPane>
          <Box maxWidth="sm">
            <Display>Welcome, {user?.name}</Display>

            <Paragraph sx={{ mt: 2 }}>
              We&apos;re delighted to have you here.
            </Paragraph>

            <Paragraph>
              Zunou is on a mission to streamline and automate daily tasks,
              allowing teams to work smarter and achieve great things.
            </Paragraph>

            <Paragraph>
              To make the magic happen, a simple set of onboarding steps is
              needed from you.
            </Paragraph>

            <Paragraph>
              You&apos;ve already conquered the first one – setting up your
              account. Great job!
            </Paragraph>

            <Paragraph>Next, we&apos;ll guide you through: magic.</Paragraph>

            <Progress />

            <LoadingButton
              loading={isPending}
              onClick={onClickNext}
              sx={{ mt: 3, width: '100%' }}
              variant="contained"
            >
              Next
            </LoadingButton>
          </Box>
        </PageLogoPane>

        <PagePatternPane>
          <Carousel />
        </PagePatternPane>
      </SplitPageLayout>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(OnboardingTermsPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

import { withAuthenticationRequired } from '@auth0/auth0-react'
import BorderAllOutlinedIcon from '@mui/icons-material/BorderAllOutlined'
import { Box } from '@mui/material'
import { useGetDataSourcesQuery } from '@zunou-queries/core/hooks/useGetDataSourcesQuery'
import { useOnboardingConfirmDataSourcesMutation } from '@zunou-queries/core/hooks/useOnboardingConfirmDataSourcesMutation'
import { LoadingButton } from '@zunou-react/components/form'
import { CenterPageLayout, PageLogoPane } from '@zunou-react/components/layout'
import { Display, Paragraph } from '@zunou-react/components/typography'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  DataSourceList,
  DataSourceNewDataSourceButton,
  NewDataSourceModal,
} from '~/components/domain/dataSource'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const OnboardingDataSourcesPage = () => {
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()

  const {
    data: getData,
    error: getError,
    isLoading: isGetLoading,
  } = useGetDataSourcesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
    },
  })
  useTrackQuery(`${Routes.OnboardingDataSources}:get`, isGetLoading)

  const {
    data: mutateData,
    error: mutateError,
    isPending: isMutatePending,
    mutate: confirmDataSources,
  } = useOnboardingConfirmDataSourcesMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.OnboardingDataSources}:continue`, isMutatePending)

  const disabled =
    !getData?.dataSources?.data?.length ||
    getData?.dataSources?.data?.length === 0

  const onClickNext = useCallback(() => {
    confirmDataSources({ organizationId })
  }, [confirmDataSources, organizationId])

  useEffect(() => {
    if (
      !mutateError &&
      mutateData?.onboardingConfirmDataSources?.data?.length &&
      mutateData?.onboardingConfirmDataSources?.data?.length > 0
    ) {
      navigate(
        pathFor({
          pathname: Routes.OnboardingSlack,
          query: { organizationId },
        }),
      )
    }
  }, [
    mutateData?.onboardingConfirmDataSources?.data?.length,
    mutateError,
    navigate,
    organizationId,
  ])

  const error = getError || mutateError

  return (
    <ErrorHandler error={error}>
      <CenterPageLayout>
        <PageLogoPane>
          <Box
            alignSelf="stretch"
            display="flex"
            justifyContent="center"
            marginBottom={3}
          >
            <Box
              display="flex"
              flex={1}
              flexDirection="column"
              gap={3}
              maxWidth="md"
            >
              <Display>Connect Data Sources</Display>

              <Paragraph>
                Zunou works like a regular employee when it comes to accessing
                your organzational data: read-only access is needed for the
                different types of data sources you may want to use. If you wish
                Zunou to consult your databases directly, a database user needs
                to be set up by your tech team. This ensures you maintain
                complete control over what Zunou can and cannot access.
              </Paragraph>

              <Box display="flex">
                <DataSourceNewDataSourceButton
                  icon={<BorderAllOutlinedIcon />}
                  onClick={() => setCsvDialogOpen(true)}
                  text="Upload CSV"
                />
              </Box>

              <Display>Your data sources</Display>

              {!isGetLoading && disabled ? (
                <Paragraph>
                  Add at least one dataset that Zunou can use in order to
                  proceed.
                </Paragraph>
              ) : null}

              {isGetLoading || disabled ? null : (
                <DataSourceList
                  dataSources={getData?.dataSources?.data}
                  disableLinks={true}
                  isLoading={isGetLoading}
                />
              )}

              <LoadingButton
                disabled={disabled}
                fullWidth={true}
                loading={isMutatePending}
                onClick={onClickNext}
                variant="contained"
              >
                Next
              </LoadingButton>
            </Box>
          </Box>

          <NewDataSourceModal
            isOpen={csvDialogOpen}
            onClose={() => setCsvDialogOpen(false)}
            organizationId={organizationId}
          />
        </PageLogoPane>
      </CenterPageLayout>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(OnboardingDataSourcesPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

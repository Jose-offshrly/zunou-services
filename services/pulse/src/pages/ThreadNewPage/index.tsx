import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CircularProgress, Typography } from '@mui/material'
import { Box, Stack } from '@mui/system'
import zunouLogo from '@zunou-react/assets/images/zunou-logo.png'
import { MessageInput } from '@zunou-react/components/form'
import { ErrorHandler, Image } from '@zunou-react/components/utility'

import { useHooks } from './hooks'

const ThreadNewPage = () => {
  const {
    allowedFileTypes,
    containerRef,
    files,
    handleSubmit,
    isLoading,
    isPendingCompletionCreation,
    isValid,
    organizationId,
    register,
    resetField,
    setValue,
    token,
  } = useHooks()

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={2} width="100%">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <ErrorHandler>
      <Stack position="relative" width="100%">
        <Stack
          alignItems="center"
          justifyContent="space-between"
          mb={10}
          overflow="auto"
          paddingX={2}
          paddingY={4}
          ref={containerRef}
          spacing={2}
        >
          <Stack
            alignItems="center"
            height="100vh"
            justifyContent="center"
            spacing={3}
          >
            <Image
              alt="Logo"
              height={96}
              src={zunouLogo}
              style={{ width: 'auto' }}
            />
            <Typography maxWidth={400} textAlign="center">
              Get instant help and guidance whenever you need it— quick, simple,
              and always here for you.
            </Typography>
          </Stack>

          <MessageInput
            allowedFileTypes={allowedFileTypes}
            coreGraphQLUrl={import.meta.env.VITE_CORE_GRAPHQL_URL}
            files={files}
            handleSubmit={handleSubmit}
            isLoadingSubmission={isLoading || isPendingCompletionCreation}
            isValid={isValid}
            organizationId={organizationId}
            register={register}
            resetField={resetField}
            setValue={setValue}
            token={token ?? undefined}
          />
        </Stack>
      </Stack>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(ThreadNewPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

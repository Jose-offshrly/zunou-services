import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CircularProgress } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { MessageInput } from '@zunou-react/components/form'
import { ErrorHandler } from '@zunou-react/components/utility'

import { MessageList } from '~/components/domain/threads/MessageList'

import { useHooks } from './hooks'

const ThreadDetailPage = () => {
  const {
    containerRef,
    files,
    handleSubmit,
    isFetching,
    isLoading,
    isLoadingMessages,
    isPendingCompletionCreation,
    lastMessageElementRef,
    messageData,
    register,
    isValid,
    organizationId,
    allowedFileTypes,
    token,
    resetField,
    setValue,
  } = useHooks()

  if (isLoadingMessages) {
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
          {messageData?.pages.map((page, index) => {
            return (
              <MessageList
                key={index}
                lastMessageElementRef={lastMessageElementRef}
                messages={page.data}
              />
            )
          })}
          <MessageInput
            allowedFileTypes={allowedFileTypes}
            coreGraphQLUrl={import.meta.env.VITE_CORE_GRAPHQL_URL}
            files={files}
            handleSubmit={handleSubmit}
            isLoadingSubmission={
              isLoading || isFetching || isPendingCompletionCreation
            }
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

export default withAuthenticationRequired(ThreadDetailPage, {
  onRedirecting: () => <div>Signing in...</div>,
})

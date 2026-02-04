import { ChatOutlined, KeyboardBackspaceOutlined } from '@mui/icons-material'
import { alpha, Box, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { MessageRole } from '@zunou-graphql/core/graphql'
import { useGetMessagesQuery } from '@zunou-queries/core/hooks/useGetMessagesQuery'
import { useGetPreviousActiveThreadQuery } from '@zunou-queries/core/hooks/useGetPreviousActiveThread'
import { useUpdateActiveThreadMutation } from '@zunou-queries/core/hooks/useUpdateActiveThreadMutation'
import { useTriggerWords } from '@zunou-react/utils/chatUtils'
import { formatMessage } from '@zunou-react/utils/messageUtils'
import { truncate } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'

const Return = ({ onReturn }: { onReturn: () => void }) => {
  const [showRevertThread, setShowRevertThread] = useState(false)
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const { setActiveThreadId, activeThreadId } = usePulseStore()

  const queryClient = useQueryClient()

  const {
    data: previousThread,
    isLoading: isPreviousThreadLoading,
    refetch: refetchPreviousThread,
  } = useGetPreviousActiveThreadQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(organizationId && pulseId),
    variables: {
      organizationId,
      pulseId,
    },
  })

  const {
    mutateAsync: updateActiveThread,
    isPending: isUpdateActiveThreadPending,
  } = useUpdateActiveThreadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const prevThreadId = useMemo(
    () => (previousThread ? previousThread.previousActiveThread?.id : null),
    [previousThread],
  )

  const { data: prevMessageData, isLoading: isPrevMessagesLoading } =
    useGetMessagesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!prevThreadId,
      variables: {
        organizationId,
        threadId: prevThreadId,
      },
    })

  const { data: activeMessageData, isLoading: isActiveMessagesLoading } =
    useGetMessagesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!activeThreadId,
      variables: {
        organizationId,
        threadId: activeThreadId,
      },
    })

  const prevMessages = useMemo(
    () => prevMessageData?.pages.flatMap((page) => page.data) ?? [],
    [prevMessageData],
  )

  const activeMessages = useMemo(
    () => activeMessageData?.pages.flatMap((page) => page.data) ?? [],
    [activeMessageData],
  )

  const prevLatestUserMessage = useMemo(() => {
    return (
      [...prevMessages].reverse().find((msg) => msg.role === MessageRole.User)
        ?.content ?? null
    )
  }, [prevMessages])

  const activeLatestUserMessage = useMemo(() => {
    return (
      [...activeMessages].reverse().find((msg) => msg.role === MessageRole.User)
        ?.content ?? null
    )
  }, [activeMessages])

  const parsedActiveLatestUserMessage = useTriggerWords({
    text: formatMessage(
      truncate(activeLatestUserMessage ?? '', { length: 200 }),
    ),
  })

  const parsedPrevLatestUserMessage = useTriggerWords({
    text: formatMessage(truncate(prevLatestUserMessage ?? '', { length: 200 })),
  })

  useEffect(() => {
    if (previousThread?.previousActiveThread) setShowRevertThread(true)
    else setShowRevertThread(false)
  }, [previousThread, isPreviousThreadLoading])

  const enableRevertThread = useMemo(
    () =>
      showRevertThread && prevLatestUserMessage && activeMessages.length <= 0,
    [showRevertThread, prevLatestUserMessage, activeMessages],
  )

  const revertThread = useCallback(async () => {
    if (isUpdateActiveThreadPending) return

    if (!prevThreadId) {
      toast.error('Previous thread ID not found.')
      return
    }

    try {
      await updateActiveThread(
        { threadId: prevThreadId },
        {
          onSuccess: ({ updateActiveThread }) => {
            queryClient.refetchQueries({
              queryKey: ['messages', organizationId, updateActiveThread.id],
            })
            setActiveThreadId(prevThreadId)
            refetchPreviousThread()
            onReturn()
          },
        },
      )
    } catch (error) {
      toast.error('Failed to revert thread')
    }
  }, [
    isUpdateActiveThreadPending,
    prevThreadId,
    updateActiveThread,
    queryClient,
    organizationId,
    setActiveThreadId,
    refetchPreviousThread,
    onReturn,
  ])

  const returnHandler = useCallback(() => {
    if (enableRevertThread) revertThread()
    else onReturn()
  }, [enableRevertThread, revertThread, onReturn])

  if (
    isPreviousThreadLoading ||
    isPrevMessagesLoading ||
    isActiveMessagesLoading
  )
    return (
      <LoadingSkeleton
        height={80}
        sx={{
          my: 1.5,
        }}
      />
    )

  if (enableRevertThread)
    return (
      <Stack
        alignItems="center"
        borderRadius={2}
        direction="row"
        gap={2}
        justifyContent="start"
        mt={4}
        onClick={returnHandler}
        px={3}
        py={1.5}
        sx={{
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.light, 0.2),
          },
          bgcolor: (theme) => alpha(theme.palette.primary.light, 0.1),
          cursor: 'pointer',
          transition: 'background-color 0.3s ease',
          width: '100%',
        }}
      >
        {isUpdateActiveThreadPending ? (
          <LoadingSpinner padding={0.5} />
        ) : (
          <Stack
            alignItems="center"
            border={2}
            borderColor="primary.main"
            borderRadius="50%"
            justifyContent="center"
            p={0.5}
          >
            <KeyboardBackspaceOutlined
              fontSize="medium"
              sx={{
                color: 'primary.main',
              }}
            />
          </Stack>
        )}

        <Stack minWidth={0} overflow="hidden">
          <Typography
            color="primary.main"
            fontWeight="600"
            sx={{ whiteSpace: 'nowrap' }}
            variant="body1"
          >
            Return to your previous conversation:
          </Typography>
          <Box
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            <Typography
              component="span"
              sx={{
                '& p': {
                  display: 'inline',
                  margin: 0,
                },
              }}
              variant="body1"
            >
              Last chat:{' '}
              <Box
                className="ql-editor"
                component="span"
                dangerouslySetInnerHTML={{
                  __html: parsedPrevLatestUserMessage,
                }}
                sx={{
                  '& p': { display: 'inline', margin: 0 },
                  wordBreak: 'break-word',
                }}
              />
            </Typography>
          </Box>
        </Stack>
      </Stack>
    )
  else if (activeLatestUserMessage)
    return (
      <Stack
        alignItems="center"
        borderRadius={2}
        direction="row"
        gap={2}
        justifyContent="start"
        mt={4}
        onClick={returnHandler}
        px={3}
        py={1.5}
        sx={{
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.light, 0.2),
          },
          bgcolor: (theme) => alpha(theme.palette.primary.light, 0.1),
          cursor: 'pointer',
          transition: 'background-color 0.3s ease',
          width: '100%',
        }}
      >
        <ChatOutlined
          fontSize="large"
          sx={{
            color: 'primary.main',
          }}
        />
        <Stack minWidth={0} overflow="hidden">
          <Typography
            color="primary.main"
            fontWeight="600"
            sx={{ whiteSpace: 'nowrap' }}
            variant="body1"
          >
            Welcome back! Return to your previous chat:
          </Typography>
          <Box
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            <Typography
              component="span"
              sx={{
                '& p': {
                  display: 'inline',
                  margin: 0,
                },
              }}
              variant="body1"
            >
              Last chat:{' '}
              <Box
                className="ql-editor"
                component="span"
                dangerouslySetInnerHTML={{
                  __html: parsedActiveLatestUserMessage,
                }}
                sx={{
                  '& p': { display: 'inline', margin: 0 },
                  wordBreak: 'break-word',
                }}
              />
            </Typography>
          </Box>
        </Stack>
      </Stack>
    )

  return null
}

export default Return

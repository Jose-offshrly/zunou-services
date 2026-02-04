import {
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteQueryObserverResult,
} from '@tanstack/react-query'
import { TeamMessage } from '@zunou-graphql/core/graphql'
import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { useJumpStore } from '~/store/useJumpStore'
import { usePulseStore } from '~/store/usePulseStore'

interface UseTeamChatScrollProps {
  messageContainerRef: RefObject<HTMLDivElement>
  messages: TeamMessage[]
  isFetchingMessages: boolean
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  fetchNextPage: (
    options?: FetchNextPageOptions,
  ) => Promise<InfiniteQueryObserverResult>
  fetchPreviousPage: (
    options?: FetchPreviousPageOptions,
  ) => Promise<InfiniteQueryObserverResult>
  isLoadingMessages?: boolean
}

const scrollToBottom = (
  containerRef: RefObject<HTMLDivElement>,
  smooth = true,
) => {
  if (containerRef.current) {
    containerRef.current.scrollTo({
      behavior: smooth ? 'smooth' : 'auto',
      top: containerRef.current.scrollHeight,
    })
  }
}

export const useTeamChatScroll = ({
  messageContainerRef,
  messages,
  isFetchingMessages,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
  fetchNextPage,
  fetchPreviousPage,
  isLoadingMessages = false,
}: UseTeamChatScrollProps) => {
  const { currentTopic } = usePulseStore()
  const { lastJumpedMessageId, anchor } = useJumpStore()
  const [hasScrolledOnLoad, setHasScrolledOnLoad] = useState(false)
  const prevScrollHeightRef = useRef<number>(0)
  const shouldScrollToBottomRef = useRef<boolean>(false)

  const handleScrollToBottom = useCallback(
    (smooth = true) => {
      scrollToBottom(messageContainerRef, smooth)
    },
    [messageContainerRef],
  )

  const triggerScrollToBottom = useCallback(() => {
    shouldScrollToBottomRef.current = true
  }, [])

  const handleLoadOlderMessages = useCallback(
    async (inView: boolean) => {
      const container = messageContainerRef.current
      if (
        inView &&
        hasNextPage &&
        !isFetchingNextPage &&
        container &&
        container.scrollTop < 100
      ) {
        prevScrollHeightRef.current = container.scrollHeight
        await fetchNextPage()
        setTimeout(() => {
          if (container) {
            const newScrollHeight: number = container.scrollHeight
            container.scrollTop =
              newScrollHeight -
              prevScrollHeightRef.current +
              container.scrollTop
          }
        }, 0)
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage, messageContainerRef],
  )

  const handleLoadNewerMessages = useCallback(
    (inView: boolean) => {
      if (inView && hasPreviousPage && !isFetchingPreviousPage) {
        fetchPreviousPage()
      }
    },
    [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage],
  )

  // // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (
      !anchor &&
      messages.length > 0 &&
      !isFetchingMessages &&
      shouldScrollToBottomRef.current
    ) {
      scrollToBottom(messageContainerRef, true)
      shouldScrollToBottomRef.current = false
    }
  }, [anchor, messages, isFetchingMessages, messageContainerRef])

  // // Initial scroll to bottom after first message load
  useEffect(() => {
    if (
      !hasScrolledOnLoad &&
      messages.length > 0 &&
      !isFetchingMessages &&
      messageContainerRef.current
    ) {
      scrollToBottom(messageContainerRef, false)
      setHasScrolledOnLoad(true)
    }
  }, [messages, hasScrolledOnLoad, isFetchingMessages, messageContainerRef])

  // Scroll to bottom on topic change
  useEffect(() => {
    if (
      messageContainerRef.current &&
      !isLoadingMessages &&
      !lastJumpedMessageId
    ) {
      scrollToBottom(messageContainerRef, false)
    }
  }, [
    currentTopic,
    messageContainerRef,
    isLoadingMessages,
    lastJumpedMessageId,
  ])

  return {
    handleLoadNewerMessages,
    handleLoadOlderMessages,
    handleScrollToBottom,
    triggerScrollToBottom,
  }
}

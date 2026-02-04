import { useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions {
  containerRef: React.RefObject<HTMLElement>
  threshold?: number // Distance from edge to trigger load (default: 100px)
}

interface ScrollHandlerOptions {
  hasMore: boolean
  isFetching: boolean
  onLoad: () => Promise<unknown> | undefined
  maintainPosition?: boolean // Whether to maintain scroll position after load
}

export const useInfiniteScrollWithPosition = ({
  containerRef,
  threshold = 100,
}: UseInfiniteScrollOptions) => {
  const prevScrollHeightRef = useRef<number>(0)

  const handleScrollLoad = useCallback(
    async (
      inView: boolean,
      direction: 'top' | 'bottom',
      options: ScrollHandlerOptions,
    ) => {
      const container = containerRef.current
      const { hasMore, isFetching, onLoad, maintainPosition = true } = options

      if (!inView || !container || !hasMore || isFetching) {
        return
      }

      // Check scroll position based on direction
      const isAtEdge =
        direction === 'top'
          ? container.scrollTop < threshold
          : container.scrollTop >
            container.scrollHeight - container.clientHeight - threshold

      if (!isAtEdge) {
        return
      }

      // Save current scroll position before loading
      if (maintainPosition) {
        if (direction === 'top') {
          // For older messages (top), save scroll height
          prevScrollHeightRef.current = container.scrollHeight
        } else {
          // For newer messages (bottom), save current scroll position
          prevScrollHeightRef.current = container.scrollTop
        }
      }

      await onLoad()

      // Restore scroll position after DOM updates
      if (maintainPosition) {
        setTimeout(() => {
          if (container) {
            if (direction === 'top') {
              // Adjust scroll to maintain position after adding content at top
              const newScrollHeight = container.scrollHeight
              container.scrollTop =
                newScrollHeight -
                prevScrollHeightRef.current +
                container.scrollTop
            } else {
              // Keep the same scroll position when adding content at bottom
              container.scrollTop = prevScrollHeightRef.current
            }
          }
        }, 0)
      }
    },
    [containerRef, threshold],
  )

  const handleLoadOlder = useCallback(
    (inView: boolean, options: ScrollHandlerOptions) => {
      return handleScrollLoad(inView, 'top', options)
    },
    [handleScrollLoad],
  )

  const handleLoadNewer = useCallback(
    (inView: boolean, options: ScrollHandlerOptions) => {
      return handleScrollLoad(inView, 'bottom', options)
    },
    [handleScrollLoad],
  )

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current
      if (container) {
        container.scrollTo({
          behavior,
          top: container.scrollHeight,
        })
      }
    },
    [containerRef],
  )

  const scrollToTop = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current
      if (container) {
        container.scrollTo({
          behavior,
          top: 0,
        })
      }
    },
    [containerRef],
  )

  return {
    handleLoadNewer,
    handleLoadOlder,
    scrollToBottom,
    scrollToTop,
  }
}

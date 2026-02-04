import Echo from 'laravel-echo'
import { debounce, throttle } from 'lodash'
import Pusher from 'pusher-js'
import { useEffect, useRef } from 'react'

const echo = new Echo({
  broadcaster: 'pusher',
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  forceTLS: true,
  key: import.meta.env.VITE_PUSHER_KEY,
})

interface UsePusherChannelProps<T = void> {
  channelName?: string | null
  eventName: string
  onEvent: (data: T) => void
  throttleMs?: number // Throttle interval in milliseconds (default: 500ms)
  debounceMs?: number // Debounce delay in milliseconds (optional, overrides throttle if set)
}

export const usePusherChannel = <T = void>({
  channelName,
  eventName,
  onEvent,
  throttleMs = 500,
  debounceMs,
}: UsePusherChannelProps<T>) => {
  // Store the latest callback in a ref to avoid re-subscriptions
  const onEventRef = useRef(onEvent)
  const throttledHandlerRef = useRef<((data: T) => void) | null>(null)

  // Update the ref whenever the callback changes
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!channelName) return

    window.Pusher = Pusher

    const channel = echo.channel(channelName)

    // Create the base handler that calls the latest callback from the ref
    const baseHandler = (data: T) => {
      onEventRef.current(data)
    }

    // Apply throttling or debouncing
    let eventHandler: (data: T) => void
    if (debounceMs) {
      // Debouncing: wait for pause before calling
      eventHandler = debounce(baseHandler, debounceMs)
    } else {
      // Throttling: max once per throttleMs
      eventHandler = throttle(baseHandler, throttleMs)
    }

    // Store reference for cleanup
    throttledHandlerRef.current = eventHandler

    channel.listen(eventName, eventHandler)

    return () => {
      channel.stopListening(eventName)
      echo.leave(channelName)

      // Cancel any pending throttled/debounced calls
      if (throttledHandlerRef.current) {
        if (debounceMs) {
          ;(throttledHandlerRef.current as ReturnType<typeof debounce>).cancel()
        } else {
          ;(throttledHandlerRef.current as ReturnType<typeof throttle>).cancel()
        }
        throttledHandlerRef.current = null
      }
    }
  }, [channelName, eventName, throttleMs, debounceMs])
}

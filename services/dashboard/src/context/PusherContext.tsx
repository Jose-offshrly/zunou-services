/* eslint-disable @typescript-eslint/no-explicit-any */

import { PulseCategory, User, UserPresence } from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { stripHtmlTags } from '@zunou-react/utils/stripHtmlTags'
import Echo from 'laravel-echo'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useGetNotification } from '~/hooks/useGetNotification'
import { Routes } from '~/services/Routes'

// Chat typing state
interface PusherChatState {
  typingUsers: Set<string>
  handleTyping: (hasContent: boolean) => void
}

interface PusherContextType {
  echo: Echo<any> | null
  ready: boolean
  getChannel: (channelName: string) => any
  leaveChannel: (channelName: string) => void
  usePusherChat: (options: PusherChatProps) => PusherChatState
  usePusherNotification: (options: PusherNotificationProps) => void
  requestPresence: () => void
  releasePresence: () => void
  presenceMap: {
    [userId: string]: UserPresence
  }
}

// Direct message API payload
interface DirectMessageSentData {
  senderName: string
  senderId: string
  receiverId: string
  message: string
  threadId: string
  organizationId: string
  timestamp: string
}

// Team message API payload
export interface TeamMessageSentData {
  userId: string
  organizationId: string
  pulseId: string
  name: string
  message: string
  pulseName: string
  replyTeamThreadId: string
  repliedToMessageId?: string | null
  metadata: Record<string, unknown>
  timestamp: string
  category: PulseCategory
}

// Message notification type
type MessageNotificationType = 'team' | 'direct'

// Message payload interface
type MessagePayload = TeamMessageSentData | DirectMessageSentData

// Pusher chat
interface PusherChatProps {
  channelName: string
  typingEventName: string
  messageEventNames: string[]
  onMessageEvent: (eventName: string, payload: TeamMessageSentData) => void
}

interface PusherNotificationProps {
  channelIds: string[]
  eventNames: string[]
  onMessageEvent?: (payload: MessagePayload) => void
  type: MessageNotificationType // 'team' | 'direct'
  shouldNotify?: boolean
  user?: User | null
  suppressFor?: { organizationId: string; pulseId: string }
  suppressCategories?: PulseCategory[]
}

// Subscription check event
interface SubscriptionEvent<Payload> {
  name: string
  handler: (payload: Payload, eventName: string) => void
  isWhisper?: boolean
}

export const PusherContext = createContext<PusherContextType | undefined>(
  undefined,
)

export const usePusherContext = (): PusherContextType => {
  const ctx = useContext(PusherContext)
  if (!ctx)
    throw new Error('usePusherContext must be used within PusherProvider')
  return ctx
}

// Subscription event pusher
function usePusherSubscription<Payload>(
  echo: Echo<any> | null,
  getChannel: (name: string) => any,
  channelNames: string[],
  events: SubscriptionEvent<Payload>[],
) {
  useEffect(() => {
    if (!echo) return
    const cleanups: (() => void)[] = []

    // Subscribe to events
    channelNames.forEach((channelName) => {
      const channel = getChannel(channelName)
      if (!channel) return

      events.forEach(({ name, handler, isWhisper }) => {
        if (isWhisper) {
          channel.listenForWhisper(name, (meta: Payload) => handler(meta, name))
          cleanups.push(() =>
            channel.stopListeningForWhisper(name, handler as never),
          )
        } else {
          channel.listen(name, (payload: Payload) => handler(payload, name))
          cleanups.push(() => channel.stopListening(name, handler as never))
        }
      })
    })

    // Cleanup events
    return () => {
      cleanups.forEach((off) => off())
    }
  }, [echo, channelNames, events, getChannel])
}

// Message event pusher
export const usePusherChat = ({
  echo,
  getChannel,
  user,
  channelName,
  typingEventName,
  messageEventNames,
  onMessageEvent,
}: PusherChatProps & {
  echo: Echo<any> | null
  getChannel: (name: string) => any
  user: { id: string; name: string }
}): PusherChatState => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const previousTypingStateRef = useRef<boolean | null>(null)

  // Handle typing users
  const handleTyping = useCallback(
    ({
      hasContent,
      name,
      userId,
    }: {
      hasContent: boolean
      name: string
      userId: string
    }) => {
      if (userId === user.id) return
      setTypingUsers((prev) => {
        const s = new Set(prev)
        hasContent ? s.add(name) : s.delete(name)
        return s
      })
    },
    [user.id],
  )

  // Send typing event users
  const sendTyping = useCallback(
    (hasContent: boolean) => {
      const ch = getChannel(channelName)
      if (!ch) return
      ch.whisper(typingEventName, {
        hasContent,
        name: user.name,
        userId: user.id,
      })
    },
    [channelName, typingEventName, user, getChannel],
  )

  // Subscribe to message events
  usePusherSubscription<TeamMessageSentData>(
    echo,
    getChannel,
    [channelName],
    messageEventNames.map((name) => ({
      handler: (payload, eventName) => onMessageEvent(eventName, payload),
      name,
    })),
  )

  // Subscribe to typing events
  usePusherSubscription<{ hasContent: boolean; name: string; userId: string }>(
    echo,
    getChannel,
    [channelName],
    [
      {
        handler: (payload) => handleTyping(payload),
        isWhisper: true,
        name: typingEventName,
      },
    ],
  )

  // Handle typing input content - only trigger on state transitions
  const handleTypingInput = useCallback(
    (hasContent: boolean) => {
      // Only send typing event when state actually changes
      if (previousTypingStateRef.current === hasContent) {
        return
      }

      // State has changed, update ref and send event
      previousTypingStateRef.current = hasContent
      sendTyping(hasContent)
    },
    [sendTyping],
  )

  return { handleTyping: handleTypingInput, typingUsers }
}

export const usePusherNotification = ({
  channelIds = [],
  eventNames,
  onMessageEvent,
  type,
  shouldNotify = true,
  user = null,
  suppressFor = { organizationId: '', pulseId: '' },
}: PusherNotificationProps) => {
  const { echo, getChannel } = usePusherContext()
  const { notify } = useGetNotification()

  const channelNames = channelIds.map((id) => `${type}.thread.${id}`)
  const lastNotificationRef = useRef<{ [key: string]: number }>({})

  const DEDUPLICATION_WINDOW = 2000 // 2 seconds

  usePusherSubscription<MessagePayload>(
    echo,
    getChannel,
    channelNames,
    eventNames.map((name) => ({
      handler: (payload: MessagePayload) => {
        // Filter out notifications for the sender
        if (
          (type === 'team' &&
            (payload as TeamMessageSentData).userId === user?.id) ||
          (type === 'direct' &&
            (payload as DirectMessageSentData).senderId === user?.id)
        ) {
          return
        }

        // Suppress notifications for the current team chat
        if (
          type === 'team' &&
          (payload as TeamMessageSentData).organizationId ===
            suppressFor.organizationId &&
          (payload as TeamMessageSentData).pulseId === suppressFor.pulseId
        ) {
          return
        }
        let notificationKey = ''
        if (type === 'team') {
          const p = payload as TeamMessageSentData
          notificationKey = `${type}-${p.organizationId}-${p.pulseId}-${p.timestamp}`
        } else if (type === 'direct') {
          const p = payload as DirectMessageSentData
          notificationKey = `${type}-${p.senderId}-${p.receiverId}-${p.timestamp}`
        }

        const now = Date.now()
        const lastTime = lastNotificationRef.current[notificationKey] || 0
        if (now - lastTime < DEDUPLICATION_WINDOW) {
          return
        }
        lastNotificationRef.current[notificationKey] = now

        // Strip HTML tags from the message
        const message = stripHtmlTags(payload.message ?? '')

        // Notify the user based on the message type
        switch (type) {
          case 'team': {
            const teamPayload = payload as TeamMessageSentData
            const url = `/manager/${pathFor({
              pathname: Routes.PulseTeamChat,
              query: {
                organizationId: teamPayload.organizationId,
                pulseId: teamPayload.pulseId,
              },
            })}`
            notify(`${teamPayload.pulseName} | Zunou AI`, shouldNotify, {
              body: `${teamPayload.name} sent a message\n\n${message}`,
              url,
            })
            break
          }
          case 'direct': {
            const directPayload = payload as DirectMessageSentData
            notify(`${directPayload.senderName} | Zunou AI`, shouldNotify, {
              body: `${directPayload.senderName} sent a message\n\n${message}`,
              member: {
                id: directPayload.senderId,
                name: directPayload.senderName,
              } as User,
            })
            break
          }
        }

        // Call the onMessageEvent callback
        onMessageEvent?.(payload)
      },
      name,
    })),
  )
}

export const PusherProvider = ({ children }: { children: ReactNode }) => {
  const { getToken, user } = useAuthContext()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const echoRef = useRef<Echo<any> | null>(null)
  const channelCache = useRef<Map<string, any>>(new Map())
  const [presenceMap, setPresenceMap] = useState<{
    [userId: string]: UserPresence
  }>({})
  const presenceSubscriptions = useRef<Map<string, number>>(new Map())
  const activeChannelsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const accessToken = await getToken()
        setToken(accessToken)
      } catch (error) {
        console.error('Failed to get token:', error)
        setToken(null)
      }
    }

    fetchToken()
  }, [getToken])

  useEffect(() => {
    if (!token) return
    try {
      echoRef.current = new Echo({
        auth: { headers: { Authorization: `Bearer ${token}` } },
        authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT,
        broadcaster: 'pusher',
        cluster: import.meta.env.VITE_PUSHER_CLUSTER,
        forceTLS: true,
        key: import.meta.env.VITE_PUSHER_KEY,
      })

      // Add connection state handlers
      echoRef.current.connector.pusher.connection.bind('connected', () => {
        console.log('Pusher connected')
        setIsConnected(true)
        setReady(true)

        // Re-subscribe to all active channels after reconnection
        activeChannelsRef.current.forEach((channelName) => {
          if (!channelCache.current.has(channelName)) {
            const channel = echoRef.current?.join(channelName)
            if (channel) {
              channelCache.current.set(channelName, channel)
            }
          }
        })
      })

      echoRef.current.connector.pusher.connection.bind('disconnected', () => {
        console.log('Pusher disconnected')
        setIsConnected(false)
        setReady(false)
      })

      echoRef.current.connector.pusher.connection.bind('reconnecting', () => {
        console.log('Pusher reconnecting')
        setIsConnected(false)
        setReady(false)
      })

      setReady(true)
    } catch {
      setReady(false)
    }
    return () => {
      echoRef.current?.disconnect()
      channelCache.current.clear()
      activeChannelsRef.current.clear()
      setReady(false)
      setIsConnected(false)
    }
  }, [token])

  const getChannel = useCallback(
    (name: string): any => {
      if (!echoRef.current) return null

      // Check if channel exists and connection is active
      const existingChannel = channelCache.current.get(name)
      if (existingChannel && isConnected) {
        return existingChannel
      }

      // Create new channel if not exists or disconnected
      const newChannel = echoRef.current.join(name)
      channelCache.current.set(name, newChannel)
      activeChannelsRef.current.add(name)
      return newChannel
    },
    [isConnected],
  )

  const leaveChannel = useCallback((name: string) => {
    if (!echoRef.current) return
    echoRef.current.leave(name)
    channelCache.current.delete(name)
    activeChannelsRef.current.delete(name)
  }, [])

  // Presence management
  const requestPresence = useCallback(() => {
    if (!echoRef.current) return

    const channel = getChannel(`users.presence`)
    if (channel) {
      channel.listen(
        '.user-presence-changed',
        (payload: { userId: string; presence: UserPresence }) => {
          setPresenceMap((prev) => ({
            ...prev,
            [payload.userId]: payload.presence,
          }))
        },
      )
    }
  }, [getChannel])

  const releasePresence = useCallback(() => {
    leaveChannel(`users.presence`)
  }, [leaveChannel])

  useEffect(() => {
    return () => {
      // Cleanup all presence subscriptions on unmount
      Array.from(presenceSubscriptions.current.keys()).forEach((userId) => {
        leaveChannel(`users.presence.${userId}`)
      })
      presenceSubscriptions.current.clear()
    }
  }, [leaveChannel])

  return (
    <PusherContext.Provider
      value={{
        echo: echoRef.current,
        getChannel,
        leaveChannel,
        presenceMap,
        ready,
        releasePresence,
        requestPresence,
        usePusherChat: (opts) =>
          usePusherChat({
            echo: echoRef.current,
            getChannel,
            user: { id: user?.id ?? '', name: user?.name ?? '' },
            ...opts,
          }),
        usePusherNotification: (opts) =>
          usePusherNotification({
            ...opts,
            user,
          }),
      }}
    >
      {children}
    </PusherContext.Provider>
  )
}

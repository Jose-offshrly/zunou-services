import { MeetingSession } from '@zunou-graphql/core/graphql'
import { getMeQuery } from '@zunou-queries/core/queries/getMeQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

export const MeetingStatusEnum = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
} as const

interface MeetingsContextType {
  googleCalLinked: boolean
  setGoogleCalLinked: (status: boolean) => void

  activeCollab: MeetingSession | null
  setActiveCollab: (collab: MeetingSession | null) => void

  error: string | null

  isLoadingLinkStatus: boolean

  refreshStatus: () => Promise<void>

  updateLinkedStatus: (status: boolean) => void

  isCollabModalOpen: boolean
  setIsCollabModalOpen: (isCollabModalOpen: boolean) => void

  isInvitePulseManuallyModalOpen: boolean
  setIsInvitePulseManuallyModalOpen: (
    isInvitePulseManuallyModalOpen: boolean,
  ) => void

  isBrainDumpModalOpen: boolean
  setIsBrainDumpModalOpen: (isInvitePulseManuallyModalOpen: boolean) => void
}
interface MeetingsProviderProps {
  children: ReactNode
}

const MeetingsContext = createContext<MeetingsContextType | undefined>(
  undefined,
)

export const useMeetingsContext = (): MeetingsContextType => {
  const context = useContext(MeetingsContext)
  if (!context) {
    throw new Error(
      'useMeetingsContext must be used within an MeetingsProvider',
    )
  }
  return context
}

export const MeetingsProvider = ({ children }: MeetingsProviderProps) => {
  const [googleCalLinked, setGoogleCalLinked] = useState(false)
  const [activeCollab, setActiveCollab] = useState<MeetingSession | null>(null)
  const [isLoadingLinkStatus, setIsLoadingLinkStatus] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false)
  const [isInvitePulseManuallyModalOpen, setIsInvitePulseManuallyModalOpen] =
    useState(false)
  const [isBrainDumpModalOpen, setIsBrainDumpModalOpen] = useState(false)

  const { getToken, isAuthenticated } = useAuthContext()
  const hasCheckedRef = useRef(false)

  /**
   * Check if Google Calendar is linked using getMeQuery
   */
  const checkGoogleCalendarStatus = useCallback(async (): Promise<boolean> => {
    // Only check if user is fully authenticated (has user in database)
    if (!isAuthenticated) {
      setGoogleCalLinked(false)
      setIsLoadingLinkStatus(false)
      return false
    }

    const token = await getToken()

    if (!token) {
      setGoogleCalLinked(false)
      return false
    }

    try {
      setIsLoadingLinkStatus(true)
      setError(null)

      const coreUrl = (import.meta.env.VITE_CORE_GRAPHQL_URL || '') as string

      const { me } = await getMeQuery(coreUrl, token)

      const isLinked = me?.google_calendar_linked ?? false
      setGoogleCalLinked(isLinked)
      return isLinked
    } catch (err) {
      console.error('Failed to check Google Calendar link status:', err)
      setGoogleCalLinked(false)
      return false
    } finally {
      setIsLoadingLinkStatus(false)
    }
  }, [getToken, isAuthenticated])

  /**
   * Manually update the linked status
   */
  const updateLinkedStatus = (status: boolean) => {
    setGoogleCalLinked(status)
  }

  /**
   * Manually refresh the linked status from the server
   */
  const refreshStatus = useCallback(async (): Promise<void> => {
    await checkGoogleCalendarStatus()
  }, [checkGoogleCalendarStatus])

  // Only check Google Calendar status when user is fully authenticated
  useEffect(() => {
    if (isAuthenticated && !hasCheckedRef.current) {
      hasCheckedRef.current = true
      checkGoogleCalendarStatus()
    } else if (!isAuthenticated) {
      hasCheckedRef.current = false
      setGoogleCalLinked(false)
      setIsLoadingLinkStatus(false)
    }
  }, [isAuthenticated, checkGoogleCalendarStatus])

  return (
    <MeetingsContext.Provider
      value={{
        activeCollab,
        error,

        googleCalLinked,
        isBrainDumpModalOpen,

        isCollabModalOpen,
        isInvitePulseManuallyModalOpen,
        isLoadingLinkStatus,
        refreshStatus,

        setActiveCollab,
        setGoogleCalLinked,

        setIsBrainDumpModalOpen,
        setIsCollabModalOpen,

        setIsInvitePulseManuallyModalOpen,
        updateLinkedStatus,
      }}
    >
      {children}
    </MeetingsContext.Provider>
  )
}

import { MeetingUrlType } from '~/components/domain/dataSource/AddMeetingLinkModal'

export const getLastPathSegment = (pathname: string, parts: number) => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= parts ? segments[parts] : ''
}

export const getPrefixSegment = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean)
  return segments[0] ?? ''
}

export const getMeetingUrlType = (rawUrl: string) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null

  const url = rawUrl.trim()

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname.toLowerCase()

    // Zoom detection
    if (hostname.match(/^([\w-]+\.)*zoom\.(us|com)$/)) {
      // Check for actual meeting URLs
      if (
        pathname.includes('/j/') ||
        pathname.includes('/meeting/') ||
        pathname.includes('/wc/join/') ||
        urlObj.search.includes('confno=')
      ) {
        return MeetingUrlType.Zoom
      }
    }

    // Google Calendar detection
    if (
      hostname === 'calendar.google.com' ||
      hostname === 'www.calendar.google.com'
    ) {
      // Check for actual meeting URLs
      if (
        pathname.includes('/event') ||
        pathname.includes('/calendar/') ||
        urlObj.search.includes('eid=')
      ) {
        return MeetingUrlType.GoogleCalendar
      }
    }

    // Microsoft Teams detection
    if (hostname === 'teams.live.com' || hostname === 'www.teams.live.com') {
      // Check for /meet/ path and password parameter
      if (pathname.startsWith('/meet/')) {
        return MeetingUrlType.MicrosoftTeams
      }
    }

    // Google Meet detection
    if (hostname === 'meet.google.com') {
      // Check for actual meeting URLs
      if (
        pathname.match(/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/) ||
        pathname.length > 1
      ) {
        return MeetingUrlType.GoogleCalendar
      }
    }

    return MeetingUrlType.Invalid
  } catch (error) {
    // If URL parsing fails
    return MeetingUrlType.Invalid
  }
}

export const extractZoomPasscode = (rawUrl: string): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null

  try {
    const urlObj = new URL(rawUrl.trim())

    // Check for pwd parameter in URL
    const pwd = urlObj.searchParams.get('pwd')
    if (pwd) {
      return pwd
    }

    // Check for other common passcode parameters
    const passcode = urlObj.searchParams.get('passcode')
    if (passcode) {
      return passcode
    }

    return null
  } catch (error) {
    return null
  }
}

export const extractTeamsPasscode = (rawUrl: string): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null

  try {
    const urlObj = new URL(rawUrl.trim())
    const hostname = urlObj.hostname.toLowerCase()

    // Only extract password from teams.live.com URLs
    if (hostname === 'teams.live.com' || hostname === 'www.teams.live.com') {
      // Check for 'p' parameter (password) in teams.live.com format
      const password = urlObj.searchParams.get('p')
      if (password) {
        return password
      }
    }

    return null
  } catch (error) {
    return null
  }
}

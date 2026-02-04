import { User } from '@zunou-graphql/core/graphql'
import { useNotificationSoundUrlQuery } from '@zunou-queries/core/hooks/useNotificationSoundUrlQuery'
import { useCallback, useEffect, useRef, useState } from 'react'

import pulseLogo from '~/assets/pulse-logo.png'
import { useDMChatWidgetStore } from '~/pages/VitalsPage/components/DMChatWidget'
import { useTeamStore } from '~/store/useTeamStore'

type NotificationPermissionState = 'default' | 'granted' | 'denied'

export interface NotificationOptions {
  body?: string
  icon?: string
  url?: string
  member?: User
}

export function useGetNotification() {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    () =>
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'default',
  )
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { data } = useNotificationSoundUrlQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  const notificationSoundUrl = data?.notificationSoundUrl

  useEffect(() => {
    const handleGesture = () => {
      if (permission === 'default' && 'Notification' in window) {
        Notification.requestPermission().then((result) => {
          setPermission(result)
        })
      }
      if (!audioRef.current && notificationSoundUrl) {
        audioRef.current = new Audio(notificationSoundUrl)
        audioRef.current.load()
      }
    }

    window.addEventListener('click', handleGesture, { once: true })
    window.addEventListener('keydown', handleGesture, { once: true })
    window.addEventListener('touchstart', handleGesture, { once: true })

    return () => {
      window.removeEventListener('click', handleGesture)
      window.removeEventListener('keydown', handleGesture)
      window.removeEventListener('touchstart', handleGesture)
    }
  }, [permission, notificationSoundUrl])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const notify = useCallback(
    (title: string, shouldNotify = true, options?: NotificationOptions) => {
      if (
        permission !== 'granted' ||
        !('Notification' in window) ||
        !shouldNotify
      )
        return

      let summary = ''
      const body = options?.body ?? ''
      try {
        const parsed = JSON.parse(body)
        summary = parsed.summary || body
      } catch (e) {
        summary = body
      }

      const notification = new Notification(title, {
        body: summary,
        icon: options?.icon ?? pulseLogo,
      })

      notification.onclick = (event) => {
        event.preventDefault()
        if (options?.url) {
          window.location.href = options.url
        } else if (options?.member) {
          if (window.location.pathname.includes('/vitals')) {
            useDMChatWidgetStore.getState().openModal(options.member)
          } else {
            useTeamStore.getState().openModal(options.member)
          }
        }
        window.focus()
        parent.focus()
        notification.close()
      }

      const audio = audioRef.current
      if (!audio) return
      audio.play()
    },
    [permission],
  )

  return { notify, permission, requestPermission }
}

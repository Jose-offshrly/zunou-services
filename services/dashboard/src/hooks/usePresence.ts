import { useEffect } from 'react'

import { usePusherContext } from '~/context/PusherContext'

export function usePresence(userIds: string[]) {
  const { requestPresence, releasePresence, presenceMap } = usePusherContext()

  useEffect(() => {
    if (userIds.length > 0) {
      requestPresence()
      return () => {
        releasePresence()
      }
    }
  }, [userIds.join(','), requestPresence, releasePresence])

  // Return only the presence for requested userIds
  const result: typeof presenceMap = {}
  userIds.forEach((id) => {
    if (presenceMap[id]) result[id] = presenceMap[id]
  })

  return result
}

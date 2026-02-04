import { UserPresence } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

export const getPresenceColor = (presence?: UserPresence) => {
  switch (presence) {
    case UserPresence.Active:
      return theme.palette.common.green || '#4caf50'
    case UserPresence.Busy:
      return theme.palette.error.main
    case UserPresence.Hiatus:
      return theme.palette.warning.main
    default:
      return theme.palette.grey[400]
  }
}

export const getPresenceText = (presence?: UserPresence) => {
  switch (presence) {
    case UserPresence.Active:
      return 'Active'
    case UserPresence.Busy:
      return 'Busy'
    case UserPresence.Hiatus:
      return 'On Break'
    default:
      return 'Offline'
  }
}

import { Badge } from '@mui/material'
import { useUnreadTeamMessagesQuery } from '@zunou-queries/core/hooks/useUnreadTeamMessagesQuery'
import { theme } from '@zunou-react/services/Theme'

import { useOrganization } from '~/hooks/useOrganization'

interface MenuItemIconProps {
  pulseId: string | undefined
}

export const MenuItemIcon = ({ pulseId }: MenuItemIconProps) => {
  const { organizationId } = useOrganization()

  const { data: unreadPulses } = useUnreadTeamMessagesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const hasUnreadMessages: boolean =
    Array.isArray(unreadPulses) && pulseId
      ? (unreadPulses.find((pulse) => pulse.id === pulseId)
          ?.unread_team_messages.length || 0) > 0
      : false

  if (!hasUnreadMessages) return null

  return (
    <Badge
      color="error"
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: '#FE6C5F',
          outline: `1px solid ${theme.palette.common.white}`,
          top: -10,
        },
      }}
      variant="dot"
    />
  )
}

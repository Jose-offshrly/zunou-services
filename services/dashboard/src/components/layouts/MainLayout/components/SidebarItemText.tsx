import { ListItemText, ListItemTextProps } from '@mui/material'
import { darken, styled, useTheme } from '@mui/material/styles'
import { useGetPulseMembersQuery } from '@zunou-queries/core/hooks/useGetPulseMembersQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo } from 'react'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

const StyledSidebarItemText = styled(ListItemText)<ListItemTextProps>(() => ({
  '& .MuiListItemText-primary': {
    textAlign: 'center',
  },
}))

export const SidebarItemText = ({
  selected,
  children,
  isInverted = false,
  oneToOneMode = false,
  pulseId,
  ...props
}: ListItemTextProps & {
  selected: boolean
  isInverted?: boolean
  pulseId?: string
  oneToOneMode?: boolean
}) => {
  const theme = useTheme()

  const normalMode = selected
    ? theme.palette.primary.main
    : theme.palette.text.primary

  const invertedMode = selected
    ? theme.palette.common.white
    : darken(theme.palette.secondary.dark, 0.1)

  const { user } = useAuthContext()

  const { data: membersData, isLoading: isLoadingPulseMembers } =
    useGetPulseMembersQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: Boolean(pulseId) && oneToOneMode,
      variables: {
        pulseId,
      },
    })

  const otherMember = useMemo(() => {
    return (
      membersData?.pulseMembers.data.find(
        (member) => member.user.id !== user?.id,
      ) ?? null
    )
  }, [membersData, pulseId])

  if (isLoadingPulseMembers && oneToOneMode)
    return (
      <LoadingSkeleton
        height={24}
        sx={{ mx: 'auto' }}
        variant="text"
        width="80%"
      />
    )

  return (
    <StyledSidebarItemText
      primaryTypographyProps={{
        style: {
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          display: '-webkit-box',
          fontSize: '12px',
          maxWidth: '100%',
          overflow: 'hidden',
          wordBreak: 'break-word',
        },
      }}
      sx={{
        color: isInverted ? invertedMode : normalMode,
      }}
      {...props}
    >
      {otherMember ? otherMember.user.name : children}
    </StyledSidebarItemText>
  )
}

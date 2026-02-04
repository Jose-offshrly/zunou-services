import {
  // ChatBubbleOutlineOutlined,
  ConnectWithoutContactOutlined,
} from '@mui/icons-material'
import { Box, Divider, IconButton, Stack, Typography } from '@mui/material'
import { User as BaseUser, UserPresence } from '@zunou-graphql/core/graphql'
// import { useMarkDirectMessagesAsReadMutation } from '@zunou-queries/core/hooks/useMarkDirectMessagesAsReadMutation'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useNavigate, useParams } from 'react-router-dom'

import ZunouIcon from '~/assets/zunou-icon'
// import { MemberItemIcon } from '~/components/domain/pulse/PulseNavbar/NavbarTop/components/MemberItemIcon'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { getPresenceColor } from '~/utils/presenceUtils'

interface User extends BaseUser {
  one_to_one?: string | null
}

interface MemberItemProps {
  member: User
  hasUnreadMessages: boolean
  currentUserId: string | undefined
  onMemberClick: (member: User) => void
  threadId: string | undefined
}

export const MemberItem = ({
  member,
  hasUnreadMessages,
  // currentUserId,
  // onMemberClick,
  // threadId,
}: MemberItemProps) => {
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const { pulseId } = useParams()
  const navigate = useNavigate()
  // const { mutate: markDirectMessagesAsRead } =
  //   useMarkDirectMessagesAsReadMutation({
  //     coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  //   })

  const handleOneToOneClick = (pulseId: string) => {
    navigate(
      `/manager/${pathFor({
        pathname:
          user?.id === member.id ? Routes.PulseDetail : Routes.PulseTeamChat,
        query: {
          organizationId,
          pulseId,
        },
      })}`,
    )
  }
  return (
    <Stack
      alignItems="center"
      borderBottom="1px solid"
      borderColor="divider"
      direction="row"
      justifyContent="space-between"
      key={member.id}
    >
      <Stack alignItems="center" direction="row" py={1.5} spacing={1}>
        <Avatar
          placeholder={member.name}
          src={member.gravatar}
          variant="rounded"
        />
        <Typography fontWeight={hasUnreadMessages ? 700 : 600} pl={1}>
          {member.name}
        </Typography>
        <Box
          sx={{
            backgroundColor:
              member.presence === UserPresence.Offline
                ? 'transparent'
                : getPresenceColor(member.presence ?? UserPresence.Offline),
            border: `2px solid ${getPresenceColor(member.presence ?? UserPresence.Offline)}`,
            borderRadius: '50%',
            height: 10,
            width: 10,
          }}
        />
        {member.email != member.name && (
          <Typography color="text.secondary">
            {member.email || 'No email'}
          </Typography>
        )}
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        {String(member?.one_to_one) !== pulseId &&
          member?.one_to_one !== null && (
            <IconButton
              onClick={() => handleOneToOneClick(String(member?.one_to_one))}
              size="medium"
              sx={{
                borderRadius: 2,
              }}
            >
              {user?.id === member.id ? (
                <ZunouIcon />
              ) : (
                <Stack
                  alignItems="center"
                  direction="row"
                  justifyContent="center"
                  spacing={1}
                >
                  <ConnectWithoutContactOutlined data-testid="people-icon" />
                  <Typography fontSize={12}>One to One</Typography>
                </Stack>
              )}
            </IconButton>
          )}
        {String(member.one_to_one) !== pulseId && user?.id !== member.id && (
          <Divider
            flexItem={true}
            orientation="vertical"
            sx={{
              height: 16,
              mx: 1,
            }}
          />
        )}
        {/* {member?.id !== currentUserId && (
          <IconButton
            onClick={() => {
              onMemberClick(member)
              if (threadId) {
                markDirectMessagesAsRead({ threadId })
              }
            }}
            size="small"
            sx={{
              p: 1,
            }}
          >
            <ChatBubbleOutlineOutlined />
          </IconButton>
        )} */}
        {/* {hasUnreadMessages && <MemberItemIcon threadId={threadId} />} */}
      </Stack>
    </Stack>
  )
}

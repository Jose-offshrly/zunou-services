import { CircularProgress, Divider, Typography } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { UserPresence } from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { SearchInput } from '~/components/ui/form/SearchInput'
import { useDirectMessages } from '~/context/DirectMessagesContext'

import { ConversationUserItem } from './components/ConversationUserItem'
import { DirectMessagesContent } from './DirectMessagesContent'
import { useOrganizationUser, useOrganizationUsers } from './hooks'

export const DirectMessagesPage = () => {
  const { organizationId } = useParams()
  const { user: authUser } = useAuthContext()
  const { activeUserId, setActiveUserId, setActiveUser } = useDirectMessages()

  const { organizationUserData } = useOrganizationUser({
    organizationId,
    userId: activeUserId,
  })

  const [searchQuery, setSearchQuery] = useState('')

  const { users, isLoading } = useOrganizationUsers({
    organizationId,
  })

  const { pinnedUsers, unpinnedUsers } = useMemo(() => {
    const search = searchQuery.toLowerCase()

    const filtered = users
      .filter((user) => user.id !== authUser?.id)
      .filter((user) => {
        const name = user.name.toLowerCase()
        return name.includes(search)
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      pinnedUsers: filtered.filter((user) => user.isPinned),
      unpinnedUsers: filtered.filter((user) => !user.isPinned),
    }
  }, [users, authUser?.id, searchQuery])

  const handleOpenDM = useCallback(
    (id: string) => {
      setActiveUserId(id)
    },
    [setActiveUserId],
  )

  useEffect(() => {
    if (organizationUserData?.organizationUser) {
      setActiveUser(organizationUserData.organizationUser)
    }
  }, [organizationUserData, setActiveUser])

  return (
    <Stack height="100%" overflow="hidden">
      <Box
        bgcolor="common.white"
        borderBottom="1px solid"
        borderColor="divider"
        p={2}
        width="100%"
      >
        <Typography fontWeight="bold" variant="body1">
          Direct Messages
        </Typography>
      </Box>
      <Stack direction="row" flex={1} overflow="hidden">
        <Stack
          divider={<Divider />}
          overflow="auto"
          spacing={1}
          sx={{
            flexShrink: 0,
          }}
          width={360}
        >
          <Stack px={2} py={1} spacing={2}>
            <Typography fontWeight="bold" variant="body1">
              My Conversations
            </Typography>
            <SearchInput
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search"
              sx={{
                bgcolor: 'common.white',
                pl: 1,
              }}
              value={searchQuery}
            />
          </Stack>

          <Stack px={2} py={1} spacing={1}>
            <Typography
              color="text.secondary"
              fontWeight="bold"
              pl={1}
              variant="caption"
            >
              STARRED
            </Typography>

            {pinnedUsers.length > 0 ? (
              pinnedUsers.map((user) => (
                <ConversationUserItem
                  {...user}
                  active={activeUserId === user.id}
                  gravatar={user.gravatar ?? ''}
                  isPinned={user.isPinned}
                  key={user.id}
                  onClick={() => handleOpenDM(user.id)}
                  one_to_one={user.one_to_one}
                  organizationUserId={user.organizationUserId}
                  userId={user.id}
                />
              ))
            ) : (
              <Typography color="text.secondary" pl={1}>
                No starred member.
              </Typography>
            )}
          </Stack>

          <Stack px={2} py={1} spacing={1}>
            <Typography
              color="text.secondary"
              fontWeight="bold"
              pl={1}
              variant="caption"
            >
              PEOPLE
            </Typography>

            {isLoading ? (
              <Stack
                alignItems="center"
                height={200}
                justifyContent="center"
                width="100%"
              >
                <CircularProgress size={20} />
              </Stack>
            ) : unpinnedUsers.length > 0 ? (
              unpinnedUsers.map((user) => (
                <ConversationUserItem
                  {...user}
                  active={activeUserId === user.id}
                  gravatar={user.gravatar ?? ''}
                  isPinned={user.isPinned}
                  key={user.id}
                  onClick={() => handleOpenDM(user.id)}
                  one_to_one={user.one_to_one}
                  organizationUserId={user.organizationUserId}
                  userId={user.id}
                  userPresence={user.presence ?? UserPresence.Offline}
                />
              ))
            ) : (
              <Typography color="text.secondary" pl={1}>
                Add members to your organization to see them here.
              </Typography>
            )}
          </Stack>
        </Stack>

        <DirectMessagesContent />
      </Stack>
    </Stack>
  )
}

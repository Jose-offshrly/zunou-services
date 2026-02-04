import { Search } from '@mui/icons-material'
import {
  alpha,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  OrganizationUser,
  PulseGuestRole,
  UserPresence,
} from '@zunou-graphql/core/graphql'
import { useGetOrganizationUsersInfiniteQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersInfiniteQuery'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import debounce from 'lodash/debounce'
import { useMemo, useState } from 'react'
import { InView } from 'react-intersection-observer'

import { RoleSelector } from '~/components/domain/pulse/SetupSettingsModal/RoleSelector'
import { useOrganization } from '~/hooks/useOrganization'
import { getPresenceColor } from '~/utils/presenceUtils'
import { getFirstLetter } from '~/utils/textUtils'
import { toTitleCase } from '~/utils/toTitleCase'

const ROLE_OPTIONS = [
  { label: 'Admin', value: PulseGuestRole.Admin },
  { label: 'Staff', value: PulseGuestRole.Staff },
  { label: 'Guest', value: PulseGuestRole.Guest },
]

interface PeopleCardProps {
  selectedMemberIds: string[]
  onMemberToggle: (member: OrganizationUser) => void
  onRoleChange: (member: OrganizationUser, newRole: PulseGuestRole) => void
  isCustomPulse?: boolean
  selectedMemberId?: string | null
  setSelectedMemberId?: (value: string | null) => void
  setSelectedMemberRole?: (value: PulseGuestRole) => void
}

export const PeopleCard = ({
  selectedMemberIds,
  onMemberToggle,
  onRoleChange,
  isCustomPulse = false,
  selectedMemberId,
  setSelectedMemberId,
  setSelectedMemberRole,
}: PeopleCardProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const [memberRoles, setMemberRoles] = useState<
    Record<string, PulseGuestRole>
  >({})

  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearchValue(value), 300),
    [],
  )

  const {
    data: organizationUsersData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetOrganizationUsersInfiniteQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      name: debouncedSearchValue || undefined,
      organizationId,
    },
  })

  const handleLoadMore = (inView: boolean) => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Flatten all pages into a single array
  const members =
    organizationUsersData?.pages.flatMap(
      (page) => page.organizationUsers.data,
    ) ?? []

  const filteredMembers = members.filter((member) => {
    return (
      member.user.id !== user?.id &&
      (isCustomPulse || member.one_to_one === null)
    )
  })

  const handleRoleChange = (
    member: OrganizationUser,
    newRole: PulseGuestRole,
  ) => {
    setMemberRoles((prev) => ({
      ...prev,
      [member.user.id]: newRole,
    }))
    onRoleChange(member, newRole)
  }

  return (
    <Card
      sx={{
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 2,
        boxShadow: 'none',
        mb: 4,
        position: 'relative',
      }}
    >
      <CardContent>
        <Typography
          color="text.primary"
          fontWeight="medium"
          sx={{ mb: 2 }}
          variant="h6"
        >
          People
        </Typography>

        <Stack direction="row" mb={2} spacing={2}>
          <Avatar
            badgeColor={getPresenceColor(UserPresence.Active)}
            isDarkMode={false}
            placeholder={getFirstLetter(user?.name ?? '')?.toUpperCase()}
            showBadge={true}
            src={user?.gravatar ?? undefined}
            variant="circular"
          />
          <Stack>
            <Typography fontWeight="medium" variant="body1">
              {user?.name}
            </Typography>
            <Typography
              color="text.secondary"
              fontWeight="medium"
              variant="body2"
            >
              Owner
            </Typography>
          </Stack>
        </Stack>

        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          fullWidth={true}
          onChange={(e) => {
            const value = e.target.value
            setSearchTerm(value)
            debouncedSetSearch(value)
          }}
          placeholder="Search members"
          size="small"
          sx={{ mb: 2 }}
          value={searchTerm}
        />

        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Stack maxHeight={300} overflow="auto">
            <List disablePadding={true}>
              {filteredMembers.map((member) => (
                <ListItem
                  disablePadding={true}
                  key={member.user.id}
                  sx={{ alignItems: 'center' }}
                >
                  {isCustomPulse ? (
                    <Checkbox
                      checked={selectedMemberIds.includes(member.user.id)}
                      edge="start"
                      onChange={() => onMemberToggle(member)}
                      sx={{
                        '&.Mui-checked': {
                          color: theme.palette.primary.main,
                        },
                        color: alpha(theme.palette.primary.main, 0.2),
                        mr: 1,
                      }}
                    />
                  ) : (
                    <Radio
                      checked={selectedMemberId === member.user.id}
                      onChange={() => {
                        setSelectedMemberId?.(member.user.id)
                        onMemberToggle(member)
                      }}
                      sx={{
                        '&.Mui-checked': {
                          color: theme.palette.primary.main,
                        },
                        color: alpha(theme.palette.primary.main, 0.2),
                        mr: 1,
                      }}
                    />
                  )}
                  <ListItemAvatar sx={{ mr: 1, position: 'relative' }}>
                    <Avatar
                      badgeColor={getPresenceColor(
                        member.user?.presence ?? UserPresence.Offline,
                      )}
                      isDarkMode={false}
                      placeholder={getFirstLetter(
                        member.user?.name,
                      )?.toUpperCase()}
                      showBadge={true}
                      src={member.user?.gravatar ?? undefined}
                      variant="circular"
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.user?.name || ''}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                    secondary={`${member.user.email} • ${member.jobTitle || toTitleCase(member.role)}`}
                    sx={{ minWidth: 120, mr: 2 }}
                  />
                  {(selectedMemberIds.includes(member.user.id) ||
                    selectedMemberId === member.user.id) && (
                    <RoleSelector
                      onChange={(newRole) => {
                        handleRoleChange(member, newRole)
                        setSelectedMemberRole?.(newRole)
                      }}
                      options={ROLE_OPTIONS}
                      value={
                        memberRoles[member.user.id] || PulseGuestRole.Staff
                      }
                    />
                  )}
                </ListItem>
              ))}
              {hasNextPage && (
                <InView
                  onChange={handleLoadMore}
                  threshold={0.1}
                  triggerOnce={false}
                >
                  {({ ref }) => (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      py={2}
                      ref={ref}
                    >
                      {isFetchingNextPage && <CircularProgress size={20} />}
                    </Stack>
                  )}
                </InView>
              )}
            </List>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

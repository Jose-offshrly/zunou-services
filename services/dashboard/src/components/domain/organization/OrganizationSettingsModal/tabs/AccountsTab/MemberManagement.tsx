import { SearchOutlined } from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Divider,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { OrganizationUserRole } from '@zunou-graphql/core/graphql'
import { useGetOrganizationUserQuery } from '@zunou-queries/core/hooks/useGetOrganizationUserQuery'
import { useGetOrganizationUsersInfiniteQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersInfiniteQuery'
import { useUpdateOrganizationUserRoleMutation } from '@zunou-queries/core/hooks/useUpdateOrganizationUserRoleMutation'
import { Button, IconButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import debounce from 'lodash/debounce'
import { ChangeEvent, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { InView } from 'react-intersection-observer'

import { SearchInput } from '~/components/ui/form/SearchInput'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useOrganization } from '~/hooks/useOrganization'
import { toTitleCase } from '~/utils/toTitleCase'

import ConfirmRoleUpdateModal from './ConfirmRoleUpdateModal'

const TableLoadingSkeleton = () => (
  <>
    <TableRow>
      <TableCell height={56}>
        <LoadingSkeleton height={32} variant="rounded" />
      </TableCell>
    </TableRow>
    <TableRow>
      <TableCell height={56} sx={{ borderBottom: 'none' }}>
        <LoadingSkeleton height={32} variant="rounded" />
      </TableCell>
    </TableRow>
  </>
)

const MemberRoleSelector = ({
  role,
  userId,
  isUpdatingRole,
  updateRole,
}: {
  role: OrganizationUserRole
  userId: string
  isUpdatingRole: boolean
  updateRole: (
    userId: string,
    newRole: OrganizationUserRole,
    oldRole: OrganizationUserRole,
  ) => Promise<void>
}) => {
  return (
    <Select
      disabled={isUpdatingRole}
      onChange={(event) =>
        updateRole(userId, event.target.value as OrganizationUserRole, role)
      }
      size="small"
      sx={{
        fontSize: 14,
        height: 32,
        minWidth: 90,
      }}
      value={role}
    >
      <MenuItem sx={{ fontSize: 14 }} value="OWNER">
        {toTitleCase(OrganizationUserRole.Owner)}
      </MenuItem>
      <MenuItem sx={{ fontSize: 14 }} value="USER">
        {toTitleCase(OrganizationUserRole.User)}
      </MenuItem>
    </Select>
  )
}

interface MemberManagementProps {
  onInvite: () => void
  onUserDemote: () => void
}

export const MemberManagement = ({
  onInvite,
  onUserDemote,
}: MemberManagementProps) => {
  const { t } = useTranslation(['common', 'settings'])
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const [autoAddEnabled, setAutoAddEnabled] = useState(false)
  const [isModalOpen, setModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')

  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearchValue(value), 300),
    [],
  )

  const {
    data: organizationUsersData,
    isLoading: isLoadingOrganizationUsers,
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

  // Flatten all pages into a single array
  const allOrganizationUsers =
    organizationUsersData?.pages.flatMap(
      (page) => page.organizationUsers.data,
    ) ?? []

  const owners = allOrganizationUsers.filter(
    (orgUser) => orgUser.role === OrganizationUserRole.Owner,
  )

  const { data: organizationUserData, isLoading: isLoadingOrganizationUser } =
    useGetOrganizationUserQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId,
        userId: user?.id,
      },
    })

  const currentUserRole = organizationUserData?.organizationUser?.role

  const { mutateAsync: mutateRole, isPending: isUpdatingRole } =
    useUpdateOrganizationUserRoleMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const [selectedUser, setSelectedUser] = useState<{
    userId: string
    newRole: OrganizationUserRole
    oldRole: OrganizationUserRole
  } | null>(null)

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
    debouncedSetSearch(value)
  }

  const handleSearchClear = () => {
    setSearchValue('')
    setDebouncedSearchValue('')
    debouncedSetSearch.cancel()
  }

  const handleSearchClose = () => {
    setSearchValue('')
    setDebouncedSearchValue('')
    debouncedSetSearch.cancel()
    setIsSearchOpen(false)
  }

  const handleSearchIconClick = () => {
    setIsSearchOpen(true)
  }

  const handleLoadMoreUsers = (inView: boolean) => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleRoleChange = async (
    userId: string,
    newRole: OrganizationUserRole,
    oldRole: OrganizationUserRole,
  ) => {
    try {
      if (
        oldRole === OrganizationUserRole.Owner &&
        (owners?.length ?? 0) <= 1
      ) {
        toast.error('An organization must have at least one owner.')
        return
      } else if (
        oldRole === OrganizationUserRole.Owner &&
        userId === user?.id
      ) {
        setSelectedUser({ newRole, oldRole, userId })
        setModalOpen(true)
        return
      }

      await mutateRole({
        organizationId,
        role: newRole,
        userId,
      })
      toast.success('Successfully updated member role!')
    } catch (error) {
      toast.error('Failed to update member role')
      console.error(error)
    }
  }

  return (
    <Stack spacing={2} sx={{ minHeight: 400 }}>
      <Stack spacing={2} sx={{ height: '100%' }}>
        <Stack spacing={1}>
          <Stack
            alignItems="flex-start"
            direction="row"
            justifyContent="space-between"
          >
            <Stack>
              <Typography fontWeight={700} variant="h6">
                {t('manage_team_members', { ns: 'settings' })}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {t('org_account_description', { ns: 'settings' })}
              </Typography>
            </Stack>
            <Stack alignItems="center" direction="row" spacing={1}>
              {isSearchOpen ? (
                <SearchInput
                  autofocus={true}
                  onChange={handleSearchChange}
                  onClear={handleSearchClear}
                  onClose={handleSearchClose}
                  placeholder="Search members..."
                  value={searchValue}
                />
              ) : (
                <IconButton
                  onClick={handleSearchIconClick}
                  size="small"
                  sx={{
                    border: 1,
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1,
                  }}
                >
                  <SearchOutlined fontSize="small" />
                </IconButton>
              )}
              {!isLoadingOrganizationUser &&
                currentUserRole === OrganizationUserRole.Owner && (
                  <Button
                    disableElevation={true}
                    onClick={onInvite}
                    size="small"
                    type="button"
                    variant="outlined"
                  >
                    {t('invite')}
                  </Button>
                )}
            </Stack>
          </Stack>
          <Divider
            sx={{
              borderColor: alpha(theme.palette.primary.main, 0.1),
              my: 2,
              width: '100%',
            }}
          />
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableBody>
              {isLoadingOrganizationUsers ? (
                <TableLoadingSkeleton />
              ) : allOrganizationUsers.length === 0 && searchValue ? (
                <TableRow>
                  <TableCell align="center" colSpan={4} sx={{ py: 4 }}>
                    <Typography color="text.secondary" variant="body2">
                      No match found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                [...allOrganizationUsers]
                  .sort((a, b) => {
                    if (a.user.id === user?.id) return -1
                    if (b.user.id === user?.id) return 1
                    return a.user.name.localeCompare(b.user.name)
                  })
                  .map(({ user: orgUser, role }, index) => {
                    const userPulses = orgUser.pulseMemberships.data.filter(
                      (pulseMembership) =>
                        pulseMembership.pulse?.organization?.id ===
                        organizationId,
                    )

                    return (
                      <TableRow
                        key={index}
                        sx={{
                          '& td': {
                            py: 1.5,
                          },
                          '&:last-child td': {
                            borderBottom: 'none',
                          },
                        }}
                      >
                        <TableCell>
                          <Stack>
                            <Stack alignItems="center" direction="row">
                              {orgUser.name}
                              {orgUser.id === user?.id && (
                                <Typography
                                  color="text.secondary"
                                  component="span"
                                  sx={{
                                    fontSize: 12,
                                    fontStyle: 'italic',
                                    ml: 0.5,
                                  }}
                                >
                                  (you)
                                </Typography>
                              )}
                            </Stack>
                            {orgUser.requestDeleteAt && (
                              <Typography
                                color="text.secondary"
                                sx={{
                                  fontSize: 12,
                                  fontStyle: 'italic',
                                }}
                              >
                                Requested deletion at{' '}
                                {new Date(
                                  orgUser.requestDeleteAt,
                                ).toLocaleDateString(undefined, {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {role !== OrganizationUserRole.Guest ? (
                            <MemberRoleSelector
                              isUpdatingRole={isUpdatingRole}
                              role={role}
                              updateRole={handleRoleChange}
                              userId={orgUser.id}
                            />
                          ) : (
                            <Stack
                              alignItems="center"
                              display="flex"
                              justifyContent="center"
                              width={90}
                            >
                              <Typography color="text.primary" variant="body2">
                                {toTitleCase(role)}
                              </Typography>
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            justifyContent="flex-start"
                            spacing={1}
                          >
                            {userPulses.length === 0
                              ? 'No pulses'
                              : `On ${userPulses.length} pulse${userPulses.length > 1 ? 's' : ''}`}
                          </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{ display: 'none' }}>
                          <Stack direction="row" justifyContent="center">
                            <IconButton
                              disabled={role !== OrganizationUserRole.Owner}
                              size="small"
                              sx={{
                                '&.Mui-disabled': {
                                  color: 'action.disabled',
                                },
                                color:
                                  role !== OrganizationUserRole.Owner
                                    ? 'error.main'
                                    : 'action.disabled',
                              }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })
              )}
              {hasNextPage && !isLoadingOrganizationUsers && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ borderBottom: 'none', py: 2 }}>
                    <InView
                      onChange={handleLoadMoreUsers}
                      threshold={0.1}
                      triggerOnce={false}
                    >
                      {({ ref }) => (
                        <Stack
                          alignItems="center"
                          justifyContent="center"
                          ref={ref}
                        >
                          {isFetchingNextPage && (
                            <LoadingSkeleton height={32} />
                          )}
                        </Stack>
                      )}
                    </InView>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Stack marginTop="auto" spacing={1}>
        <Divider
          sx={{
            borderColor: alpha(theme.palette.primary.main, 0.1),
            width: '100%',
          }}
        />
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography color="text.disabled" fontSize={14}>
            {t('auto_add_sign_ups', { ns: 'settings' })}
          </Typography>
          <Switch
            checked={autoAddEnabled}
            disabled={true}
            onChange={(e) => setAutoAddEnabled(e.target.checked)}
          />
        </Stack>
      </Stack>

      <ConfirmRoleUpdateModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onUserDemote={onUserDemote}
        selectedUser={selectedUser}
      />
    </Stack>
  )
}

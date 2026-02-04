import { ChevronLeft, Send as SendIcon } from '@mui/icons-material'
import {
  Autocomplete,
  Avatar,
  lighten,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  OrganizationUser,
  PulseCategory,
  PulseGuestRole,
} from '@zunou-graphql/core/graphql'
import { useCreatePulseMemberMutation } from '@zunou-queries/core/hooks/useCreatePulseMemberMutation'
import { useGetOrganizationUsersQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersQuery'
import { useInvitePulseGuestMutation } from '@zunou-queries/core/hooks/useInvitePulseGuestMutation'
import { Button, Chip, LoadingButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, ControllerRenderProps, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { RoleSelector } from '~/components/domain/pulse/SetupSettingsModal/RoleSelector'
import { useOrganization } from '~/hooks/useOrganization'
import { zodResolver } from '~/libs/zod'
import {
  InvitePulseMemberParams,
  invitePulseMemberSchema,
} from '~/schemas/InvitePulseMemberSchema'
import { usePulseStore } from '~/store/usePulseStore'

import { GuestInviteStatus } from './GuestInviteStatus'

const pulseMemberInviteRoles = Object.values(PulseGuestRole).map((role) => ({
  label: role,
  value: role,
}))

interface TeamInviteFormProps {
  onBackClick: () => void
}

export const TeamInviteForm = ({ onBackClick }: TeamInviteFormProps) => {
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pulse, pulseMembers } = usePulseStore()

  const [selectedRole, setSelectedRole] = useState<PulseGuestRole>(
    PulseGuestRole.Staff,
  )
  const [inputValue, setInputValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [guestInviteState, setGuestInviteState] = useState<{
    show: boolean
    email: string
    status: 'success' | 'error'
  }>({ email: '', show: false, status: 'success' })

  const { control, handleSubmit, watch, setValue } =
    useForm<InvitePulseMemberParams>({
      defaultValues: {
        input: [],
      },
      resolver: zodResolver(invitePulseMemberSchema),
    })

  const selectedUsers = watch('input') || []

  const { mutateAsync: addPulseMember, isPending: isPendingInvite } =
    useCreatePulseMemberMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { data: organizationUsersData, isLoading: isLoadingOrganizationUsers } =
    useGetOrganizationUsersQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        name: searchTerm || undefined,
        organizationId,
      },
    })

  const { mutateAsync: invitePulseGuest } = useInvitePulseGuestMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  // refetch server if no match found in current data when searching a user
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!inputValue) {
        setSearchTerm('')
        return
      }

      const orgUsers = organizationUsersData?.organizationUsers?.data ?? []
      const hasClientMatch = orgUsers.some((user) =>
        user.user.email.toLowerCase().includes(inputValue.toLowerCase()),
      )

      // triggers server refetching for the user being searched
      if (!hasClientMatch) {
        setSearchTerm(inputValue)
      } else {
        setSearchTerm('')
      }
    }, 300)

    return () => clearTimeout(timer) // debounce search
  }, [inputValue])

  const filteredOrganizationUsers = useMemo(() => {
    const orgUsers = organizationUsersData?.organizationUsers?.data ?? []
    return orgUsers.filter(
      (orgUser) =>
        !pulseMembers.some(
          (pulseMember) => orgUser.userId === pulseMember.userId,
        ),
    )
  }, [organizationUsersData, pulseMembers])

  const isValidEmail = useCallback((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }, [])

  const handleRoleChange = useCallback(
    (
      newRole: PulseGuestRole,
      field: ControllerRenderProps<InvitePulseMemberParams, 'input'>,
    ) => {
      setSelectedRole(newRole)
      field.onChange(
        selectedUsers.map((user) => ({
          ...user,
          role: newRole,
        })),
      )
    },
    [selectedUsers],
  )

  const handleGuestInvite = async (email: string) => {
    if (!pulseId || !organizationId) {
      toast.error('Missing required information')
      return
    }

    try {
      await invitePulseGuest({
        email,
        organizationId,
        pulseId,
        role: PulseGuestRole.Guest,
      })
      setGuestInviteState({ email, show: true, status: 'success' })
      toast.success('Guest invite sent successfully')
    } catch (error) {
      setGuestInviteState({ email, show: true, status: 'error' })
      toast.error('Failed to send guest invite')
      console.error(error)
    }
  }

  const handleAutocompleteChange = useCallback(
    (
      newValue: (OrganizationUser | string)[],
      field: ControllerRenderProps<InvitePulseMemberParams, 'input'>,
    ) => {
      const lastValue = newValue[newValue.length - 1]
      if (typeof lastValue === 'string') {
        handleGuestInvite(lastValue)
        newValue = newValue.slice(0, -1)
      }

      field.onChange(
        newValue
          .map((user) => {
            if (typeof user === 'string') return null
            return {
              role: selectedRole,
              userId: user.user.id,
            }
          })
          .filter(Boolean),
      )
    },
    [selectedRole],
  )

  const onSubmit = async (data: InvitePulseMemberParams) => {
    if (!pulseId) {
      toast.error('Pulse ID is missing')
      return
    }

    try {
      await addPulseMember({
        input: data.input,
        pulseId,
      })
      toast.success('Invitations sent successfully')
      setValue('input', [])
      onBackClick()
    } catch (error) {
      toast.error('Failed to send invitations')
      console.error(error)
    }
  }

  if (guestInviteState.show) {
    return (
      <GuestInviteStatus
        email={guestInviteState.email}
        onProceed={() => {
          setGuestInviteState({ email: '', show: false, status: 'success' })
          onBackClick()
        }}
        status={guestInviteState.status}
      />
    )
  }

  return (
    <Stack>
      <Stack spacing={2}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="flex-start" spacing={1}>
              <Button
                color="inherit"
                onClick={onBackClick}
                startIcon={<ChevronLeft fontSize="small" />}
              >
                Back
              </Button>
            </Stack>
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
            >
              <Stack>
                <Typography fontWeight="bold" variant="h6">
                  Invite Pulse Members
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Invite or manage your pulse members to{' '}
                  <Typography
                    color="primary.main"
                    component="span"
                    variant="body2"
                  >
                    {pulse?.name}
                  </Typography>
                </Typography>
              </Stack>
              {pulse?.category === PulseCategory.Team && (
                <LoadingButton
                  disabled={selectedUsers.length === 0}
                  loading={isPendingInvite}
                  type="submit"
                  variant="contained"
                >
                  Add
                </LoadingButton>
              )}
            </Stack>
            <Stack spacing={2}>
              <Controller
                control={control}
                name="input"
                render={({ field }) => (
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
                      <Stack width="100%">
                        <Autocomplete
                          disableClearable={true}
                          filterOptions={(options) => {
                            const filtered = options.filter(
                              (option: OrganizationUser) =>
                                option.user.email
                                  .toLowerCase()
                                  .includes(inputValue.toLowerCase()) &&
                                !selectedUsers.some(
                                  (user) => user.userId === option.user.id,
                                ),
                            )

                            // Add guest invite option if valid email and no matches
                            if (
                              inputValue &&
                              isValidEmail(inputValue) &&
                              !filtered.some(
                                (option) =>
                                  option.user.email.toLowerCase() ===
                                  inputValue.toLowerCase(),
                              ) &&
                              selectedUsers.length === 0
                            ) {
                              filtered.push(
                                inputValue as unknown as OrganizationUser,
                              )
                            }

                            return filtered
                          }}
                          fullWidth={true}
                          getOptionLabel={(option) => {
                            if (typeof option === 'string') return option
                            return option.user.email
                          }}
                          inputValue={inputValue}
                          isOptionEqualToValue={(option, value) => {
                            if (typeof value === 'string') {
                              return (
                                typeof option === 'string' && option === value
                              )
                            }
                            return option.user.id === value.user.id
                          }}
                          loading={isLoadingOrganizationUsers}
                          multiple={true}
                          onChange={(_, newValue) => {
                            handleAutocompleteChange(newValue, field)
                          }}
                          onInputChange={(_, newInputValue) => {
                            setInputValue(newInputValue)
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === 'Enter' &&
                              inputValue &&
                              isValidEmail(inputValue) &&
                              !filteredOrganizationUsers.some(
                                (option) =>
                                  option.user.email.toLowerCase() ===
                                  inputValue.toLowerCase(),
                              ) &&
                              selectedUsers.length === 0
                            ) {
                              event.preventDefault()
                              handleGuestInvite(inputValue)
                              setInputValue('')
                            }
                          }}
                          options={filteredOrganizationUsers}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder={
                                selectedUsers.length === 0
                                  ? 'Type to search emails'
                                  : ''
                              }
                            />
                          )}
                          renderOption={(props, option) => {
                            if (typeof option === 'string') {
                              return (
                                <MenuItem {...props}>
                                  <Stack
                                    alignItems="flex-start"
                                    direction="row"
                                    spacing={1}
                                  >
                                    <SendIcon
                                      color="primary"
                                      fontSize="small"
                                    />
                                    <Stack direction="row" flexWrap="wrap">
                                      <Typography mr={1}>
                                        Send Guest Invite to
                                      </Typography>
                                      <Typography
                                        color={theme.palette.primary.main}
                                      >
                                        {option}
                                      </Typography>
                                    </Stack>
                                  </Stack>
                                </MenuItem>
                              )
                            }
                            return (
                              <MenuItem {...props}>
                                <Stack
                                  alignItems="center"
                                  direction="row"
                                  spacing={1}
                                >
                                  <Avatar
                                    src={option.user.gravatar ?? ''}
                                    sx={{ height: 24, width: 24 }}
                                  >
                                    {option.user.name?.[0]?.toUpperCase()}
                                  </Avatar>
                                  <Typography>{option.user.email}</Typography>
                                </Stack>
                              </MenuItem>
                            )
                          }}
                          renderTags={(value, getTagProps) =>
                            value
                              .map((option, index) => {
                                if (typeof option === 'string') return null

                                return (
                                  <Chip
                                    {...getTagProps({ index })}
                                    key={option.user.id}
                                    label={option.user.email}
                                    size="small"
                                    sx={{
                                      backgroundColor: lighten(
                                        theme.palette.primary.main,
                                        0.8,
                                      ),
                                      color: theme.palette.text.secondary,
                                    }}
                                  />
                                )
                              })
                              .filter(Boolean)
                          }
                          sx={{
                            '& .MuiInputBase-root': {
                              height: 'auto',
                              minHeight: '50px',
                            },
                          }}
                        />
                      </Stack>
                      <RoleSelector
                        disabled={selectedUsers.length === 0}
                        onChange={(role) => handleRoleChange(role, field)}
                        options={pulseMemberInviteRoles}
                        value={selectedRole}
                      />
                    </Stack>
                  </Stack>
                )}
              />
            </Stack>
          </Stack>
        </form>
      </Stack>
    </Stack>
  )
}

import {
  Autocomplete,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useGetOrganizationUserQuery } from '@zunou-queries/core/hooks/useGetOrganizationUserQuery'
import { useUpdateMeMutation } from '@zunou-queries/core/hooks/useUpdateMeMutation'
import { useUpdateOrganizationUserMutation } from '@zunou-queries/core/hooks/useUpdateOrganizationUserMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import React, { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import timezones from 'timezones-list'

import { useOrganization } from '~/hooks/useOrganization'
import { zodResolver } from '~/libs/zod'
import {
  UpdateOrganizationUserParams,
  updateOrganizationUserSchema,
} from '~/schemas/UpdateOrganizationUserSchema'

import LanguageSelect from './component/LanguageSelect'
import { ProfileSection } from './component/ProfileSection'

interface GeneralTabProps {
  isEditMode?: boolean
  onSave?: () => void
  onCancel?: () => void
  onSubmitRef?: React.MutableRefObject<(() => void) | null>
  onFormChange?: (hasChanges: boolean) => void
  onCancelRef?: React.MutableRefObject<(() => void) | null>
}

const GeneralTab = ({
  isEditMode = false,
  onSave,
  onSubmitRef,
  onFormChange,
  onCancelRef,
}: GeneralTabProps) => {
  const { t } = useTranslation()
  const { user, refetchUser } = useAuthContext()
  const { organizationId } = useOrganization()

  const { data: organizationUserData } = useGetOrganizationUserQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      userId: user?.id,
    },
  })
  const orgUser = organizationUserData?.organizationUser

  const { mutateAsync: updateUser } = useUpdateMeMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: updateOrganizationUser } =
    useUpdateOrganizationUserMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateOrganizationUserParams>({
    defaultValues: {
      department: orgUser?.department || '',
      jobTitle: orgUser?.jobTitle || '',
      name: user?.name || '',
      profile: orgUser?.profile || '',
      timezone: user?.timezone || 'UTC',
    },
    mode: 'onChange',
    resolver: zodResolver(updateOrganizationUserSchema),
  })

  const watchedValues = useWatch({
    control,
    name: ['name', 'jobTitle', 'department', 'profile', 'timezone'],
  })

  const [name, jobTitle, department, profile, timezone] = watchedValues

  // Memoize the sorted timezone codes
  const timezonesOptions = useMemo(() => {
    return timezones
      .sort((a, b) => a.tzCode.localeCompare(b.tzCode))
      .map((tz) => tz.tzCode)
  }, [])

  const onSubmit = async (data: UpdateOrganizationUserParams) => {
    try {
      if (!orgUser) throw Error('No organization user found.')

      const userUpdates: {
        name?: string
        timezone?: string
        lastOrganizationId: string
      } = {
        lastOrganizationId: organizationId,
      }

      if (data.name && data.name !== user?.name) {
        userUpdates.name = data.name
      }

      if (data.timezone && data.timezone !== user?.timezone) {
        userUpdates.timezone = data.timezone
      }

      if (userUpdates.name || userUpdates.timezone) {
        await updateUser(userUpdates)
        await refetchUser()
      }

      await updateOrganizationUser({
        department: data.department,
        jobTitle: data.jobTitle,
        organizationUserId: orgUser.id,
        profile: data.profile,
      })

      toast.success('Successfully updated Organization User!')
      onSave?.()
    } catch (error) {
      toast.error('Error updating Organization User')
      console.error(error)
    }
  }

  const onSubmitHandler = handleSubmit((data: UpdateOrganizationUserParams) => {
    onSubmit(data)
  })

  const handleCancel = () => {
    reset({
      department: orgUser?.department || '',
      jobTitle: orgUser?.jobTitle || '',
      name: user?.name || '',
      profile: orgUser?.profile || '',
      timezone: user?.timezone || 'UTC',
    })
  }

  useEffect(() => {
    if (onSubmitRef) {
      onSubmitRef.current = onSubmitHandler
    }
  }, [onSubmitHandler, onSubmitRef])

  useEffect(() => {
    if (onCancelRef) {
      onCancelRef.current = handleCancel
    }
  }, [handleCancel, onCancelRef])

  useEffect(() => {
    if (orgUser && user) {
      reset({
        department: orgUser.department || '',
        jobTitle: orgUser.jobTitle || '',
        name: user.name || '',
        profile: orgUser.profile || '',
        timezone: user.timezone || 'UTC',
      })
    }
  }, [orgUser, user, reset])

  useEffect(() => {
    if (onFormChange && isEditMode) {
      onFormChange(isDirty)
    }
  }, [isDirty, onFormChange, isEditMode])

  const renderViewMode = () => (
    <Stack spacing={2}>
      <ProfileSection user={user!} />
      <TableContainer>
        <Table
          size="small"
          sx={{
            '& tr td:first-of-type': {
              color: 'text.secondary',
              py: 2,
              width: 150,
            },
            '& tr:last-child td': {
              borderBottom: 'none',
            },
          }}
        >
          <TableBody>
            <TableRow>
              <TableCell>{t('name')}</TableCell>
              <TableCell>
                <Typography variant="body2">{name || 'N/A'}</Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('title')}</TableCell>
              <TableCell>
                <Typography variant="body2">{jobTitle || 'N/A'}</Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('department')}</TableCell>
              <TableCell>
                <Typography variant="body2">{department || 'N/A'}</Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('profile')}</TableCell>
              <TableCell>
                <Typography variant="body2">{profile || 'N/A'}</Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('timezone')}</TableCell>
              <TableCell>
                <Typography variant="body2">{timezone || 'N/A'}</Typography>
              </TableCell>
            </TableRow>
            <LanguageSelect />
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )

  const renderEditMode = () => (
    <Stack spacing={2}>
      <ProfileSection user={user!} />
      <TableContainer>
        <Table
          size="small"
          sx={{
            '& tr td:first-of-type': {
              color: 'text.secondary',
              py: 2,
              width: 150,
            },
            '& tr:last-child td': {
              borderBottom: 'none',
            },
          }}
        >
          <TableBody>
            <TableRow>
              <TableCell>{t('name')}</TableCell>
              <TableCell>
                <TextField
                  {...register('name')}
                  error={!!errors.name}
                  fullWidth={true}
                  helperText={errors.name?.message}
                  id="name"
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('title')}</TableCell>
              <TableCell>
                <TextField
                  {...register('jobTitle')}
                  fullWidth={true}
                  id="jobTitle"
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('department')}</TableCell>
              <TableCell>
                <TextField
                  {...register('department')}
                  fullWidth={true}
                  id="department"
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('profile')}</TableCell>
              <TableCell>
                <TextField
                  {...register('profile')}
                  fullWidth={true}
                  id="profile"
                  multiline={true}
                  rows={2}
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('timezone')}</TableCell>
              <TableCell>
                <Controller
                  control={control}
                  name="timezone"
                  render={({ field }) => (
                    <Autocomplete
                      ListboxProps={{
                        style: { maxHeight: 300 },
                      }}
                      autoComplete={true}
                      autoHighlight={true}
                      disableClearable={true}
                      filterSelectedOptions={true}
                      fullWidth={true}
                      onChange={(_, newValue) => field.onChange(newValue)}
                      options={timezonesOptions}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth={true}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      renderOption={(props, option) => {
                        const currentOption = timezones.find(
                          (tz) => tz.tzCode === option,
                        )
                        return (
                          <Box
                            component="li"
                            sx={{
                              minWidth: 150,
                            }}
                            {...props}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 2,
                                justifyContent: 'space-between',
                                width: '100%',
                              }}
                            >
                              <Typography
                                sx={{
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                }}
                                variant="body2"
                              >
                                {option}
                              </Typography>
                              <Typography
                                color="text.secondary"
                                variant="body2"
                              >
                                {currentOption?.utc}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      }}
                      style={{ width: '100%' }}
                      value={field.value || ''}
                    />
                  )}
                />
              </TableCell>
            </TableRow>
            <LanguageSelect />
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )

  return isEditMode ? renderEditMode() : renderViewMode()
}

export default GeneralTab

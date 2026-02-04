import { Autocomplete, Box, TextField, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateMeMutation } from '@zunou-queries/core/hooks/useUpdateMeMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { truncate } from 'lodash'
import { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import timezones from 'timezones-list'

import { EditableTableRow } from '~/components/ui/table/EditableTableRow'
import { useOrganization } from '~/hooks/useOrganization'

// Create a Map for O(1) lookup - this should ideally be outside component or in a separate file
const timezoneMap = new Map(timezones.map((tz) => [tz.tzCode, tz]))

const TimezoneSelect = () => {
  const { t } = useTranslation()
  const { user, refetchUser, isLoading } = useAuthContext()
  const { pulseId } = useParams<{ pulseId: string }>()
  const { organizationId } = useOrganization()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isValid },
  } = useForm<{ timezone: string }>({
    mode: 'onChange',
    values: {
      timezone: user?.timezone ?? 'UTC',
    },
  })

  const queryClient = useQueryClient()

  const { mutateAsync: updateMe } = useUpdateMeMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const timezone = watch('timezone')

  // Memoize the sorted timezone codes - only computed once
  const timezonesOptions = useMemo(() => {
    return timezones
      .sort((a, b) => a.tzCode.localeCompare(b.tzCode))
      .map((tz) => tz.tzCode)
  }, [])

  // Memoize the render option function to prevent recreating on every render
  const renderOption = useCallback(
    (props: React.HTMLAttributes<HTMLLIElement>, option: string) => {
      // O(1) lookup instead of O(n) find
      const currentOption = timezoneMap.get(option)

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
              sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
              variant="body2"
            >
              {option}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {currentOption?.utc}
            </Typography>
          </Box>
        </Box>
      )
    },
    [],
  )

  const onSubmitHandler = handleSubmit(async (data: { timezone: string }) => {
    await updateMe({
      lastOrganizationId: organizationId,
      timezone: data.timezone,
    })
    await refetchUser()
    // Invalidate all visible data to update datetime
    queryClient.invalidateQueries({ exact: false, queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['teamMessages', pulseId] })
    queryClient.invalidateQueries({
      queryKey: ['dataSources', organizationId, pulseId],
    })
  })

  return (
    <EditableTableRow
      editComponent={
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
              renderOption={renderOption}
              style={{ width: '100%' }}
              value={field.value}
            />
          )}
        />
      }
      isLoading={isLoading}
      isValid={isValid}
      label={t('timezone')}
      onSubmit={onSubmitHandler}
      reset={reset}
      value={truncate(timezone, { length: 40 })}
    />
  )
}

export default TimezoneSelect

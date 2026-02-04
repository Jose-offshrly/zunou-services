import { zodResolver } from '@hookform/resolvers/zod'
import { alpha, Stack, Typography, useTheme } from '@mui/material'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import {
  SelectField,
  SwitchInput,
  TextField,
} from '@zunou-react/components/form'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { VitalsCustomModalWithSubmit } from '~/components/ui/VitalsCustomModalWithSubmit'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import {
  CreateMeetingManuallyParams,
  createMeetingManuallySchema,
} from '~/schemas/CreateMeetingManuallySchema'
import {
  extractTeamsPasscode,
  extractZoomPasscode,
  getMeetingUrlType,
} from '~/utils/urlUtils'

import { useHooks } from './hooks'

export enum MeetingUrlType {
  GoogleCalendar = 'GOOGLE_CALENDAR',
  MicrosoftTeams = 'MICROSOFT_TEAMS',
  Zoom = 'ZOOM',
  Invalid = 'INVALID',
}

interface AddMeetingLinkModalProps {
  isOpen: boolean
  onClose: () => void
  isVitalsMode?: boolean
}

const AddMeetingLinkModal = ({
  isOpen,
  onClose,
  isVitalsMode = false,
}: AddMeetingLinkModalProps) => {
  const { t } = useTranslation(['common', 'vitals'])
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { setting } = useVitalsContext()
  const muiTheme = useTheme()
  const isDarkMode = setting.theme === 'dark' && isVitalsMode
  const { createMeeting, isCreateMeetingSessionPending } =
    useHooks(organizationId)

  const [isValid, setIsValid] = useState(false)

  const { data: pulsesData, isLoading: isLoadingPulses } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const pulseOptions = useMemo(
    () =>
      pulsesData
        ? pulsesData.pulses.map((pulse) => ({
            label: pulse.name,
            value: pulse.id,
          }))
        : [],
    [pulsesData],
  )

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid: formIsValid },
  } = useForm<CreateMeetingManuallyParams>({
    defaultValues: {
      isInvited: true,
      isRecurring: false,
      passcode: '',
      pulse: '',
      url: '',
    },
    mode: 'onChange',
    resolver: zodResolver(createMeetingManuallySchema(isVitalsMode)),
  })

  const { url, passcode, pulse } = useWatch({ control })

  const urlType = useMemo(() => {
    return getMeetingUrlType(url || '')
  }, [url])

  const zoomPasscodeFromUrl = useMemo(() => {
    return urlType === MeetingUrlType.Zoom
      ? extractZoomPasscode(url || '')
      : null
  }, [url, urlType])

  const teamsPasscodeFromUrl = useMemo(() => {
    return urlType === MeetingUrlType.MicrosoftTeams
      ? extractTeamsPasscode(url || '')
      : null
  }, [url, urlType])

  const shouldShowPasscodeField = useMemo(() => {
    return (
      (urlType === MeetingUrlType.Zoom && !zoomPasscodeFromUrl) ||
      (urlType === MeetingUrlType.MicrosoftTeams && !teamsPasscodeFromUrl)
    )
  }, [urlType, zoomPasscodeFromUrl, teamsPasscodeFromUrl])

  // Update isValid state based on form validation and additional conditions
  useEffect(() => {
    const hasValidUrl =
      url && url.trim() !== '' && urlType !== MeetingUrlType.Invalid
    const hasValidPulse = !isVitalsMode || (pulse && pulse.trim() !== '')
    const hasValidPasscode =
      !shouldShowPasscodeField || (passcode && passcode.trim() !== '')

    const newIsValid =
      formIsValid && hasValidUrl && hasValidPulse && hasValidPasscode

    setIsValid(Boolean(newIsValid))
  }, [
    formIsValid,
    url,
    urlType,
    pulse,
    passcode,
    isVitalsMode,
    shouldShowPasscodeField,
  ])

  // Auto-fill passcode when URL contains it
  useEffect(() => {
    const passcodeToSet = teamsPasscodeFromUrl || zoomPasscodeFromUrl

    if (passcodeToSet) {
      setValue('passcode', passcodeToSet, {
        shouldDirty: true,
        shouldValidate: true,
      })
    } else {
      // Clear passcode if zoom/teams
      setValue('passcode', '', {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [zoomPasscodeFromUrl, teamsPasscodeFromUrl, setValue])

  const handleFormSubmit = handleSubmit(
    async (data: CreateMeetingManuallyParams) => {
      const targetPulse = isVitalsMode ? data.pulse : pulseId

      const passcode =
        zoomPasscodeFromUrl || teamsPasscodeFromUrl || data.passcode || null

      await createMeeting(
        data.url,
        data.isInvited,
        passcode,
        targetPulse,
        () => {
          reset()
          handleClose()
        },
      )
    },
  )

  const handleClose = () => {
    reset()
    setIsValid(false)
    onClose()
  }

  return (
    <VitalsCustomModalWithSubmit
      disabledSubmit={!isValid}
      isOpen={isOpen}
      isSubmitting={isCreateMeetingSessionPending}
      maxHeight={650}
      maxWidth={750}
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={handleFormSubmit}
      submitText={t('invite')}
      title={t('invite_pulse_to_meeting', { ns: 'sources' })}
      vitalsMode={isVitalsMode}
    >
      <Stack gap={3} p={0.5}>
        <Stack spacing={1}>
          <Typography fontWeight="bold">
            {t('meeting_link', { ns: 'vitals' })}
          </Typography>
          <TextField
            InputLabelProps={{ shrink: true }}
            control={control}
            error={errors.url}
            fullWidth={true}
            name="url"
            placeholder="e.g https://meet.google.com/chu-wgt-qkz"
            required={true}
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: isDarkMode
                  ? muiTheme.palette.grey[900]
                  : undefined,
                color: isDarkMode ? muiTheme.palette.common.white : undefined,
              },
              '& .MuiInputLabel-root': {
                color: isDarkMode ? muiTheme.palette.grey[400] : undefined,
              },
            }}
            value={url}
          />
          <Typography color="text.secondary" variant="caption">
            {t('supports_other_platforms', { ns: 'vitals' })}
          </Typography>
        </Stack>

        {shouldShowPasscodeField && (
          <Stack spacing={1}>
            <Typography fontWeight="bold">Meeting Passcode</Typography>
            <TextField
              InputLabelProps={{ shrink: true }}
              control={control}
              error={errors.passcode}
              fullWidth={true}
              name="passcode"
              placeholder="Enter Passcode"
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: isDarkMode
                    ? muiTheme.palette.grey[900]
                    : undefined,
                  color: isDarkMode ? muiTheme.palette.common.white : undefined,
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? muiTheme.palette.grey[400] : undefined,
                },
              }}
              value={passcode}
            />
          </Stack>
        )}

        {isVitalsMode && (
          <Stack spacing={1}>
            <Typography
              fontWeight="bold"
              sx={{ color: isDarkMode ? 'common.white' : 'text.primary' }}
            >
              {t('add_to_pulse', { ns: 'vitals' })}
            </Typography>
            <SelectField
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: isDarkMode
                      ? muiTheme.palette.grey[900]
                      : undefined,
                    color: isDarkMode
                      ? muiTheme.palette.common.white
                      : undefined,
                  },
                },
              }}
              control={control}
              disabled={isLoadingPulses}
              helperText={errors.pulse?.message}
              name="pulse"
              options={pulseOptions}
              placeholder={t('select_pulse', { ns: 'vitals' })}
              required={isVitalsMode}
              sx={{
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? muiTheme.palette.grey[400] : undefined,
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode
                      ? muiTheme.palette.grey[700]
                      : undefined,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isDarkMode
                      ? muiTheme.palette.primary.main
                      : undefined,
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode
                      ? muiTheme.palette.grey[500]
                      : undefined,
                  },
                  backgroundColor: isDarkMode
                    ? muiTheme.palette.grey[900]
                    : undefined,
                  color: isDarkMode ? muiTheme.palette.common.white : undefined,
                },
                '& .MuiSelect-icon': {
                  color: isDarkMode ? muiTheme.palette.grey[400] : undefined,
                },
              }}
            />
          </Stack>
        )}

        <Stack
          alignItems="center"
          border={1}
          borderColor="divider"
          borderRadius={1}
          px={1}
          py={2}
          spacing={1}
          sx={(theme) => ({
            bgcolor: alpha(theme.palette.primary.light, 0.03),
          })}
        >
          <Stack
            borderBottom={1}
            borderColor="divider"
            paddingBottom={2}
            width="100%"
          >
            <Typography>
              {t('automatically_invited_to_this_meeting', { ns: 'vitals' })}
            </Typography>
          </Stack>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            width="100%"
          >
            <Stack>
              <Typography color="text.secondary" fontWeight="500">
                {t('recurring_meeting', { ns: 'vitals' })}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {t('recurring_description', { ns: 'vitals' })}
              </Typography>
            </Stack>
            <SwitchInput
              control={control}
              disabled={true}
              id="isRecurring"
              name="isRecurring"
              onChange={(checked) => {
                setValue('isRecurring', checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
            />
          </Stack>
        </Stack>
      </Stack>
    </VitalsCustomModalWithSubmit>
  )
}

export default AddMeetingLinkModal

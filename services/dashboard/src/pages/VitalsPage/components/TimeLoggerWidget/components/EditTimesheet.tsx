import { Stack, Typography } from '@mui/material'
import { Timesheet } from '@zunou-graphql/core/graphql'
import { useUpdateTimesheetMutation } from '@zunou-queries/core/hooks/useUpdateTimesheetMutation'
import { Button, Form, LoadingButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { TimeSelector } from '~/components/ui/date/TimeSelector'
import { zodResolver } from '~/libs/zod'
import {
  UpdateTimesheetParams,
  updateTimesheetSchema,
} from '~/schemas/UpdateTimesheetSchema'

interface Props {
  timesheet: Timesheet
  onClose: () => void
}

export const EditTimesheet = ({ timesheet, onClose }: Props) => {
  const { t } = useTranslation(['common', 'vitals'])
  const { user } = useAuthContext()
  const timezone = user?.timezone ?? 'UTC'

  const { handleSubmit, reset, setValue } = useForm<UpdateTimesheetParams>({
    mode: 'onChange',
    resolver: zodResolver(updateTimesheetSchema),
  })

  const { mutate: updateTimesheet, isPending: isUpdatingTimesheet } =
    useUpdateTimesheetMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleSelectCheckInTime = (time: Dayjs | null) => {
    if (!time) return

    const formatted = dayjs.utc(time).format('YYYY-MM-DD HH:mm:ss')
    setValue('checkIn', formatted)
  }

  const handleSelectCheckOutTime = (time: Dayjs | null) => {
    if (!time) return

    const formatted = dayjs.utc(time).format('YYYY-MM-DD HH:mm:ss')
    setValue('checkOut', formatted)
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  const onSubmit = (data: UpdateTimesheetParams) => {
    updateTimesheet(
      {
        checked_in_at: data.checkIn,
        checked_out_at: data.checkOut,
        id: timesheet.id,
      },
      {
        onError: (error) => {
          toast.error(t('update_timesheet_error', { ns: 'vitals' }))
          console.error('Failed to update timesheet:', error)
        },
        onSettled: () => {
          onClose()
        },
        onSuccess: () => {
          toast.success(t('update_timesheet_success', { ns: 'vitals' }))
          reset()
        },
      },
    )
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} sx={{ padding: 0 }}>
      <Stack spacing={4}>
        <Stack spacing={2}>
          <Stack alignItems="center" direction="row" spacing={2}>
            <Typography
              fontWeight="bold"
              sx={{ minWidth: 120 }}
              variant="subtitle2"
            >
              {t('user')}
            </Typography>
            <Typography variant="body2">{timesheet.user?.name}</Typography>
          </Stack>
          <Stack alignItems="center" direction="row" spacing={2}>
            <Typography
              fontWeight="bold"
              sx={{ minWidth: 120 }}
              variant="subtitle2"
            >
              {t('date', { ns: 'vitals' })}
            </Typography>
            <Typography color="text.primary" variant="body2">
              {timesheet.checked_in_at
                ? dayjs
                    .utc(timesheet.checked_in_at)
                    .tz(timezone)
                    .format('MMMM D, YYYY')
                : '-:--'}
            </Typography>
          </Stack>
          <Stack alignItems="center" direction="row" spacing={2}>
            <Typography
              fontWeight="bold"
              sx={{ minWidth: 120 }}
              variant="subtitle2"
            >
              {t('check_in', { ns: 'vitals' })}
            </Typography>
            <TimeSelector
              onSelect={handleSelectCheckInTime}
              value={dayjs.utc(timesheet.checked_in_at).tz(timezone)}
            />
          </Stack>
          <Stack alignItems="center" direction="row" spacing={2}>
            <Typography
              fontWeight="bold"
              sx={{ minWidth: 120 }}
              variant="subtitle2"
            >
              {t('check_out', { ns: 'vitals' })}
            </Typography>
            <TimeSelector
              onSelect={handleSelectCheckOutTime}
              value={dayjs.utc(timesheet.checked_out_at).tz(timezone)}
            />
          </Stack>
        </Stack>
        <Stack spacing={1}>
          <Button color="inherit" onClick={handleCancel} variant="outlined">
            {t('cancel')}
          </Button>
          <LoadingButton
            loading={isUpdatingTimesheet}
            type="submit"
            variant="contained"
          >
            {t('save')}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  )
}

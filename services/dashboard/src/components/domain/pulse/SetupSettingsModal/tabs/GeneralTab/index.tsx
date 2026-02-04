import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Divider, Icon, TextField, Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { PulseType } from '@zunou-graphql/core/graphql'
import { useUpdatePulseMutation } from '@zunou-queries/core/hooks/useUpdatePulseMutation'
import {
  Button,
  LoadingButton,
  SwitchInput,
} from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import {
  UpdatePulseParams,
  updatePulseSchema,
} from '~/schemas/UpdatePulseSchema'
import { usePulseStore } from '~/store/usePulseStore'
import { getPulseIcon } from '~/utils/getPulseIcon'

import Header from '../../components/Header'

export const GeneralTab = () => {
  // const { t } = useTranslation()
  const { pulseId } = useParams()
  const { pulse } = usePulseStore()
  const [isEditMode, setIsEditMode] = useState(false)

  const { mutateAsync: updatePulse, isPending: isPendingUpdatePulse } =
    useUpdatePulseMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isDirty },
  } = useForm<
    UpdatePulseParams & {
      autoSummarizeMeetings: boolean
      notifyOnMentions: boolean
      showUrgentTasks: boolean
    }
  >({
    mode: 'onChange',
    resolver: zodResolver(updatePulseSchema),
    values: {
      autoSummarizeMeetings: true,
      description: pulse?.description ?? '',
      icon: pulse?.icon ?? PulseType.Generic,
      name: pulse?.name ?? '',
      notifyOnMentions: true,
      showUrgentTasks: true,
    },
  })

  const onSubmit = async (data: UpdatePulseParams) => {
    if (!pulseId) throw new Error('Pulse ID not found.')

    try {
      await updatePulse({
        description: data.description,
        icon: data?.icon,
        name: data.name,
        pulseId,
      })

      toast.success('Successfully updated pulse settings!')
      setIsEditMode(false)
    } catch (error) {
      toast.error('Failed to update pulse settings')
      console.error(error)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditMode(false)
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  return (
    <Stack gap={2} height="100%">
      <Header
        description="Configure how your pulse works"
        title="Pulse Settings"
      >
        {/* Action Buttons */}
        <Stack
          alignItems="center"
          direction="row"
          gap={2}
          justifyContent="flex-end"
        >
          {!isEditMode ? (
            <Button onClick={handleEdit} variant="contained">
              Edit
            </Button>
          ) : (
            <>
              <Button
                disabled={isPendingUpdatePulse}
                onClick={handleCancel}
                variant={isPendingUpdatePulse ? 'contained' : 'text'}
              >
                Cancel
              </Button>
              <LoadingButton
                disabled={!isDirty}
                loading={isPendingUpdatePulse}
                onClick={handleSubmit(onSubmit)}
                variant="contained"
              >
                Save
              </LoadingButton>
            </>
          )}
        </Stack>
      </Header>
      <Stack
        divider={<Divider orientation="horizontal" />}
        flexGrow={1}
        gap={3}
        overflow="auto"
        p={2}
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.text.primary, 0.2),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: alpha(theme.palette.text.primary, 0.3),
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
        }}
      >
        {/* Name */}
        <Stack alignItems="center" direction="row" gap={2}>
          <Typography color="text.secondary" variant="body2" width="20%">
            Name
          </Typography>
          <TextField
            {...register('name')}
            disabled={!isEditMode}
            error={!!errors.name}
            helperText={errors.name?.message}
            id="name"
            size="small"
            sx={{
              flexGrow: 1,
            }}
          />
        </Stack>

        {/* Icon */}
        <Stack alignItems="flex-start" direction="row" gap={2}>
          <Typography color="text.secondary" variant="body2" width="20%">
            Icon
          </Typography>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <Box
                sx={{
                  display: 'grid',
                  flexGrow: 1,
                  gap: 2,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                }}
              >
                {Object.values(PulseType).map((type) => (
                  <Box
                    key={type}
                    onClick={() => isEditMode && field.onChange(type)}
                    sx={{
                      '&:hover': isEditMode
                        ? {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderColor: 'primary.main',
                          }
                        : {},
                      alignItems: 'center',
                      bgcolor:
                        field.value === type
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'transparent',
                      border: '1px solid',
                      borderColor:
                        field.value === type
                          ? 'primary.main'
                          : alpha(theme.palette.text.primary, 0.2),
                      borderRadius: 2,
                      cursor: isEditMode ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      justifyContent: 'center',
                      opacity: !isEditMode ? 0.6 : 1,
                      p: 2,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon
                      component={getPulseIcon(type)}
                      sx={{
                        color:
                          field.value === type
                            ? 'primary.main'
                            : 'text.primary',
                        fontSize: 24,
                      }}
                    />
                    <Typography
                      fontSize={12}
                      sx={{
                        color:
                          field.value === type
                            ? 'primary.main'
                            : 'text.secondary',
                      }}
                    >
                      {type.charAt(0).toUpperCase() +
                        type.slice(1).toLowerCase()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          />
        </Stack>

        {/* Description */}
        <Stack alignItems="flex-start" direction="row" gap={2}>
          <Typography color="text.secondary" pt={1} variant="body2" width="20%">
            Description
          </Typography>
          <TextField
            {...register('description')}
            disabled={!isEditMode}
            error={!!errors.description}
            helperText={errors.description?.message}
            id="description"
            multiline={true}
            rows={5}
            size="small"
            sx={{
              flexGrow: 1,
            }}
          />
        </Stack>

        {/* Auto Summarize */}
        <Stack alignItems="center" direction="row" gap={2}>
          <Stack color="action.disabledBackground" flexGrow={1}>
            <Typography fontWeight={500} variant="body2">
              Auto-summarize meetings
            </Typography>
            <Typography variant="caption">
              Automatically generate summaries after meetings end
            </Typography>
          </Stack>
          <SwitchInput
            control={control}
            disabled={true}
            id="autoSummarizeMeetings"
            name="autoSummarizeMeetings"
          />
        </Stack>

        <Stack alignItems="center" direction="row" gap={2}>
          <Stack color="action.disabledBackground" flexGrow={1}>
            <Typography fontWeight={500} variant="body2">
              Notify on mentions
            </Typography>
            <Typography variant="caption">
              Get notified when you&apos;re mentioned in Chat
            </Typography>
          </Stack>
          <SwitchInput
            control={control}
            disabled={true}
            id="notifyOnMentions"
            name="notifyOnMentions"
          />
        </Stack>

        <Stack alignItems="center" direction="row" gap={2}>
          <Stack color="action.disabledBackground" flexGrow={1}>
            <Typography fontWeight={500} variant="body2">
              Show urgent tasks
            </Typography>
            <Typography variant="caption">
              Surface urgent tasks in your daily pulse summary
            </Typography>
          </Stack>
          <SwitchInput
            control={control}
            disabled={true}
            id="showUrgentTasks"
            name="showUrgentTasks"
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Stack, TextField, Typography } from '@mui/material'
import { TaskEntity, TaskType } from '@zunou-graphql/core/graphql'
import { useCreateTaskMutation } from '@zunou-queries/core/hooks/useCreateTaskMutation'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { useOrganization } from '~/hooks/useOrganization'
import {
  CreateTaskParams,
  createTaskSchema,
} from '~/schemas/CreatePulseTaskSchema'
import { usePulseStore } from '~/store/usePulseStore'

interface CreateTaskListModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateTaskListModal = ({
  isOpen,
  onClose,
}: CreateTaskListModalProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pulse } = usePulseStore()
  const titleInputRef = useRef<HTMLInputElement | null>(null)

  const {
    control,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<CreateTaskParams>({
    resolver: zodResolver(createTaskSchema),
  })

  const titleValue = watch('title')

  // Autofocus title input when dialog opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const { mutate: createTask, isPending: isPendingCreateTask } =
    useCreateTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleCancel = () => {
    onClose()
    reset()
  }

  const onSubmitHandler = handleSubmit(
    ({ description, title }: CreateTaskParams) => {
      if (!pulseId) throw new Error('Pulse ID is missing')

      createTask(
        [
          {
            description,
            entity_id: pulseId,
            entity_type: TaskEntity.Pulse,
            organization_id: organizationId,
            task_type: TaskType.List,
            title,
          },
        ],
        {
          onError: (error) => {
            const message = error?.response?.errors?.[0]?.message
            if (message) {
              toast.error(message)
            } else {
              toast.error(t('task_creation_error', { ns: 'tasks' }))
            }
          },
          onSuccess: () => {
            toast.success(t('new_task_list_created', { ns: 'tasks' }))
            reset()
            onClose()
          },
        },
      )
    },
  )

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (titleValue?.trim()) {
        onSubmitHandler()
      }
    }
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const pulseName = pulse?.name || 'My Tasks'

  return (
    <CustomModalWithSubmit
      disabledSubmit={!isValid || isPendingCreateTask}
      footerText="Press Enter to create task list"
      headerContent={
        <Stack alignItems="center" direction="row" spacing={1}>
          <Typography color="text.secondary" variant="caption">
            You&apos;re creating a task list in:
          </Typography>
          <Typography sx={{ fontWeight: 500 }} variant="caption">
            {pulseName}
          </Typography>
        </Stack>
      }
      isOpen={isOpen}
      isSubmitting={isPendingCreateTask}
      maxHeight="90vh"
      maxWidth={900}
      onCancel={handleCancel}
      onClose={onClose}
      onSubmit={onSubmitHandler}
      submitOnEnter={true}
      submitText={t('create_list', { ns: 'tasks' })}
      title={t('create_task_list', { ns: 'tasks' })}
    >
      <Stack spacing={3}>
        {/* Title Input */}
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <TextField
              {...field}
              InputProps={{
                disableUnderline: true,
              }}
              autoFocus={true}
              disabled={isPendingCreateTask}
              fullWidth={true}
              inputRef={(e) => {
                field.ref(e)
                titleInputRef.current = e
              }}
              onKeyDown={handleTitleKeyDown}
              placeholder={t('task_list_title_placeholder', { ns: 'tasks' })}
              variant="standard"
            />
          )}
        />

        {/* Description Input */}
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextField
              {...field}
              disabled={isPendingCreateTask}
              fullWidth={true}
              multiline={true}
              onKeyDown={handleDescriptionKeyDown}
              placeholder="Add a description…"
              rows={4}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: 'small',
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused fieldset': {
                    border: 'none',
                  },
                  '&:hover fieldset': {
                    border: 'none',
                  },
                },
                backgroundColor: '#fafafa',
              }}
            />
          )}
        />

        {/* Error messages */}
        {(errors.title?.message || errors.description?.message) && (
          <Typography color="error" variant="caption">
            {errors.title?.message || errors.description?.message}
          </Typography>
        )}
      </Stack>
    </CustomModalWithSubmit>
  )
}

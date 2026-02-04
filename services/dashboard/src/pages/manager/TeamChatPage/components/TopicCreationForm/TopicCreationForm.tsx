import { zodResolver } from '@hookform/resolvers/zod'
import { Stack, TextField } from '@mui/material'
import { Button } from '@zunou-react/components/form/Button'
import { useCallback, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

interface TopicCreationFormProps {
  onSubmit?: (data: { title: string }) => void
  onCancel?: () => void
  isLoading?: boolean
  placeholder?: string
  submitButtonText?: string
  cancelButtonText?: string
}

export const TopicCreationForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  placeholder,
  submitButtonText,
  cancelButtonText,
}: TopicCreationFormProps) => {
  const { t } = useTranslation('topics')

  const topicCreationSchema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(1, t('topic_title_required'))
          .min(3, t('topic_title_min_length'))
          .max(50, t('topic_title_max_length'))
          .regex(/^[a-zA-Z0-9\s\-_]+$/, t('topic_title_invalid_chars')),
      }),
    [t],
  )

  type TopicCreationFormData = z.infer<typeof topicCreationSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<TopicCreationFormData>({
    defaultValues: {
      title: '',
    },
    resolver: zodResolver(topicCreationSchema),
  })

  const watchedTitle = useWatch({
    control,
    name: 'title',
  })

  const handleFormSubmit = useCallback(
    (data: { title: string }) => {
      try {
        onSubmit?.({ title: data.title })

        reset()
      } catch (error) {
        console.error('Error creating topic:', error)
        toast.error(t('failed_to_create_topic_please_try_again'))
      }
    },
    [onSubmit, reset, t],
  )

  const handleCancel = useCallback(() => {
    reset()
    onCancel?.()
  }, [reset, onCancel])

  const isFormValid =
    watchedTitle && watchedTitle.trim().length >= 3 && !errors.title

  return (
    <Stack
      alignItems="center"
      direction="row"
      spacing={1}
      sx={{ width: '100%' }}
    >
      <TextField
        {...register('title')}
        autoFocus={true}
        disabled={isLoading}
        error={!!errors.title}
        helperText={errors.title?.message}
        placeholder={placeholder ?? t('topic_title')}
        size="small"
        sx={{ backgroundColor: 'white', width: '80%' }}
      />
      <Button
        disabled={isLoading}
        onClick={handleCancel}
        sx={{
          width: '10%',
        }}
        variant="outlined"
      >
        {cancelButtonText ?? t('cancel')}
      </Button>
      <Button
        disabled={!isFormValid || isLoading}
        onClick={handleSubmit(handleFormSubmit)}
        sx={{
          width: '10%',
        }}
        variant="contained"
      >
        {submitButtonText ?? t('create')}
      </Button>
    </Stack>
  )
}

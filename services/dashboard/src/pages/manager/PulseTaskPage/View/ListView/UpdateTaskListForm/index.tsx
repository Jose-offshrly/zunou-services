import { zodResolver } from '@hookform/resolvers/zod'
import { DeleteOutlined, MenuOutlined } from '@mui/icons-material'
import { Divider, Stack, TextField, Typography } from '@mui/material'
import { TaskType } from '@zunou-graphql/core/graphql'
import { useGetTaskQuery } from '@zunou-queries/core/hooks/useGetTaskQuery'
import { useUpdateTaskMutation } from '@zunou-queries/core/hooks/useUpdateTaskMutation'
import { Button, Form, IconButton } from '@zunou-react/components/form'
import { Card, CardContent } from '@zunou-react/components/layout'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { EditableTextField } from '~/components/ui/form/EditableTextField'
import { useOrganization } from '~/hooks/useOrganization'
import {
  UpdateTaskListParams,
  updateTaskListSchema,
} from '~/schemas/UpdateTaskListSchema'
import { CreateTaskInput, usePulseStore } from '~/store/usePulseStore'

import { LoadingState } from './LoadingState'

interface UpdateTaskListFormProps {
  onCancel: () => void
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void
  taskId: string
}

export const UpdateTaskListForm = ({
  onCancel,
  onDelete,
  taskId,
}: UpdateTaskListFormProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pulseActions, addActionToPulse } = usePulseStore()

  const formRef = useRef<HTMLDivElement>(null)
  const hasInitializedRef = useRef(false)
  const hasSetInitialValuesRef = useRef(false)

  const { data: taskData, isFetching: isFetchingTaskList } = useGetTaskQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      taskId,
    },
  })
  const taskList = taskData?.task

  // Get pulse action once for initial state
  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  const editTaskInput = useMemo(() => {
    return pulseAction?.editTaskInput.find((input) => input.id === taskId)
  }, [pulseAction, taskId])

  // Calculate initial values - prioritize global state over API data
  const initialValues = useMemo(() => {
    if (!taskList) return {}

    // If we have saved state in global store, use it
    if (editTaskInput) {
      return {
        description: editTaskInput.description ?? '',
        title: editTaskInput.title ?? '',
      }
    }

    // Otherwise use API data
    return {
      description: taskList.description ?? '',
      title: taskList.title ?? '',
    }
  }, [taskList, editTaskInput])

  const [isShowTaskDescription, setIsShowTaskDescription] = useState(
    editTaskInput?.isShowDescription ??
      (taskList?.description?.length ?? 0) > 0,
  )

  const {
    control,
    register,
    getValues,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<UpdateTaskListParams>({
    mode: 'onChange',
    resolver: zodResolver(updateTaskListSchema),
  })

  const watchedValues = useWatch({ control })

  // Initialize form when task data is loaded
  useEffect(() => {
    if (
      taskList &&
      Object.keys(initialValues).length > 0 &&
      !hasSetInitialValuesRef.current
    ) {
      reset(initialValues)

      setIsShowTaskDescription(
        editTaskInput?.isShowDescription ??
          (initialValues.description?.length ?? 0) > 0,
      )

      hasSetInitialValuesRef.current = true

      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true
      }
    }
  }, [taskList, initialValues, editTaskInput, reset])

  // Debounced function to save current form state to store
  const saveCurrentStateToStore = useMemo(() => {
    return debounce(() => {
      if (!pulseId || !taskList || !hasInitializedRef.current) return

      const currentValues = getValues()
      const hasContent = Object.values(currentValues).some(
        (value) => value && (typeof value === 'string' ? value.trim() : true),
      )

      if (hasContent) {
        const taskInput: CreateTaskInput = {
          ...currentValues,
          id: taskId,
          isShowDescription: isShowTaskDescription,
          location: taskId,
          type: TaskType.List,
        }

        const currentPulseAction = pulseActions.find(
          (pulse) => pulse.id === pulseId,
        )
        const inputs = [...(currentPulseAction?.editTaskInput || [])].filter(
          (input) => input.id !== taskId,
        )

        inputs.push(taskInput)

        addActionToPulse({
          id: pulseId,
          updates: { editTaskInput: inputs },
        })
      }
    }, 500)
  }, [
    pulseId,
    taskId,
    taskList,
    isShowTaskDescription,
    getValues,
    addActionToPulse,
    pulseActions,
  ])

  // Save form state periodically
  useEffect(() => {
    if (!hasInitializedRef.current || !taskList) return

    saveCurrentStateToStore()

    return () => {
      saveCurrentStateToStore.cancel()
    }
  }, [watchedValues, isShowTaskDescription])

  // Handle description toggle
  const toggleTaskDescription = useCallback(() => {
    setIsShowTaskDescription((prev) => !prev)
  }, [])

  // Handle clicks outside form
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        // Save immediately when clicking outside
        saveCurrentStateToStore.cancel()
        saveCurrentStateToStore.flush()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [saveCurrentStateToStore])

  const { mutate: updateTask, isPending: isPendingUpdateTask } =
    useUpdateTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleCancel = useCallback(() => {
    if (pulseId) {
      // Get current pulse action to avoid stale closure
      const currentPulseAction = pulseActions.find(
        (pulse) => pulse.id === pulseId,
      )
      addActionToPulse({
        id: pulseId,
        updates: {
          editTaskInput:
            currentPulseAction?.editTaskInput?.filter(
              (input) => input.id !== taskId,
            ) || [],
        },
      })
    }

    onCancel()
  }, [pulseActions, addActionToPulse, pulseId, taskId, onCancel])

  const onSubmitHandler = handleSubmit((data: UpdateTaskListParams) => {
    const { description, title } = data

    // Cancel any pending saves before submitting
    saveCurrentStateToStore.cancel()

    updateTask(
      {
        description,
        organization_id: organizationId,
        taskId,
        title,
      },
      {
        onError: () =>
          toast.error(t('task_list_update_error', { ns: 'tasks' })),
        onSettled: () => handleCancel(),
        onSuccess: () => {
          toast.success(t('task_list_updated', { ns: 'tasks' }))
          reset()
        },
      },
    )
  })

  return (
    <div ref={formRef}>
      <Form maxWidth="lg" onSubmit={onSubmitHandler} sx={{ padding: 0 }}>
        <Card>
          <CardContent>
            {isFetchingTaskList ? (
              <LoadingState />
            ) : (
              <Stack divider={<Divider />} spacing={2}>
                <Stack spacing={2}>
                  <EditableTextField
                    errors={errors}
                    name="title"
                    placeholder={t('task_title_placeholder', { ns: 'tasks' })}
                    register={register}
                    value={initialValues.title}
                  />
                  <Stack spacing={1}>
                    <Stack
                      alignItems="center"
                      direction="row"
                      onClick={toggleTaskDescription}
                      spacing={1}
                      sx={{ color: 'text.secondary', cursor: 'pointer' }}
                    >
                      <MenuOutlined fontSize="small" />
                      <Typography color="text.secondary" variant="body2">
                        {!isShowTaskDescription &&
                        initialValues.description?.trim()
                          ? initialValues.description
                          : t('description')}
                      </Typography>
                    </Stack>
                    {isShowTaskDescription && (
                      <TextField
                        {...register('description')}
                        maxRows={10}
                        minRows={4}
                        multiline={true}
                        sx={{
                          '& textarea': {
                            maxHeight: '520px',
                            resize: 'vertical',
                          },
                        }}
                      />
                    )}
                  </Stack>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <IconButton onClick={onDelete}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                  <Stack alignSelf="end" direction="row" spacing={1}>
                    <Button onClick={handleCancel} variant="outlined">
                      {t('cancel')}
                    </Button>
                    <Button
                      disabled={!isValid || isPendingUpdateTask}
                      type="submit"
                      variant="contained"
                    >
                      {t('update_task_list', { ns: 'tasks' })}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Form>
    </div>
  )
}

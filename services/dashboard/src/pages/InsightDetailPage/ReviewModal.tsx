import { Circle } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { ActionMethods, ActionTypes } from '@zunou-graphql/core/graphql'
import { useExecuteInsightRecommendationMutation } from '@zunou-queries/core/hooks/useExecuteInsightRecommendationMutation'
import { useUpdateRecommendationActionMutation } from '@zunou-queries/core/hooks/useUpdateRecommendationActionMutation'
import { Button, Form, LoadingButton } from '@zunou-react/components/form'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { CustomModal } from '~/components/ui/CustomModal'
import { removeMentions } from '~/utils/textUtils'

import MeetingForm from './components/MeetingForm'
import NoteForm from './components/NoteForm'
import TaskForm from './components/TaskForm'
import TeamChatForm from './components/TeamChatForm'
import TypeChip from './components/TypeChip'

dayjs.extend(advancedFormat)

interface Props {
  isOpen: boolean
  onClose: () => void
  recommendation: {
    id: string
    type: ActionTypes
    pulseName: string
    pulseId?: string
    organizationId: string
    name: string
    description: string
    actionId: string
    insightId?: string
    method?: ActionMethods
  }
  initialData?: Partial<FormData>
}

interface FormData {
  note_title?: string
  note_description?: string
  note_pinned?: boolean
  note_labels?: string[]
  task_title?: string
  task_description?: string
  task_assignees?: string[]
  task_status?: string
  task_dueDate?: string
  task_priority?: string
  teamchat_message?: string
  meeting_summary?: string
  meeting_action_items?: {
    title: string
    description: string
    assignees: { name: string }[]
    status: string
    priority: string
    due_date: string | null
  }[]
  meeting_potential_strategies?: string[]
  task_mention?: string[]
}

export const stripHtml = (str: string, mentions?: string[]) => {
  const clean = mentions ? removeMentions(mentions, str) : str

  if (!clean) return ''
  const noTags = clean.replace(/<[^>]*>/g, '') // remove HTML tags

  console.log('STRIPPED! ', _.trim(noTags))
  return _.trim(noTags) // clean whitespace using lodash
}

export const ReviewModal = ({
  recommendation,
  isOpen,
  onClose,
  initialData,
}: Props) => {
  const queryClient = useQueryClient()

  const methods = useForm<FormData>({
    defaultValues: initialData || {},
    mode: 'onChange',
  })
  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods

  const [isUpdating, setIsUpdating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  const { mutateAsync: updateRecommendation } =
    useUpdateRecommendationActionMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutateAsync: executeRecommendation } =
    useExecuteInsightRecommendationMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  useEffect(() => {
    if (isOpen) {
      reset(initialData || {})
    }
  }, [isOpen, initialData, reset])

  const onSubmit = async (data: FormData) => {
    if (!recommendation.pulseId || !recommendation.insightId) return

    setIsExecuting(true)

    if (isDirty) {
      const payload = transformFormData(data, recommendation.type)

      const updateRes = await updateRecommendation({
        changes: JSON.stringify(payload),
        insightId: recommendation.insightId,
        recommendationActionsId: recommendation.actionId,
        type: recommendation.type,
      })

      if (
        !updateRes.updateRecommendationAction.success ||
        !updateRes.updateRecommendationAction
      )
        return

      methods.reset()
    }

    const executeResponse = await executeRecommendation({
      insightId: recommendation.insightId,
      organizationId: recommendation.organizationId,
      pulseId: recommendation.pulseId,
      recommendationId: recommendation.id,
    })

    if (executeResponse.executeInsightRecommendation.success) {
      await queryClient.refetchQueries({
        queryKey: ['liveInsightsRecommendation', recommendation.insightId],
      })
      toast.success(
        executeResponse.executeInsightRecommendation.message ??
          'Recommendation successfully executed.',
      )
      setIsExecuting(false)
      onClose()
    } else {
      toast.error(
        executeResponse.executeInsightRecommendation.message ??
          'Recommendation execution failed.',
      )
      setIsExecuting(false)
    }
  }

  const onUpdate = async (data: FormData) => {
    if (!recommendation.insightId) return

    setIsUpdating(true)

    const payload = transformFormData(data, recommendation.type)

    const updateResponse = await updateRecommendation({
      changes: JSON.stringify(payload),
      insightId: recommendation.insightId,
      recommendationActionsId: recommendation.actionId,
      type: recommendation.type,
    })

    if (updateResponse.updateRecommendationAction.success) {
      toast.success(
        updateResponse.updateRecommendationAction.message ??
          'Recommendation successfully updated.',
      )
    } else {
      toast.error(
        updateResponse.updateRecommendationAction.message ??
          'Recommendation update failed.',
      )
    }

    methods.reset()

    setIsUpdating(false)
  }

  const transformFormData = (data: FormData, type: ActionTypes) => {
    switch (type) {
      case ActionTypes.Note:
        return {
          note_description: data.note_description,
          note_labels: data.note_labels?.map(
            (label: string | { id: string; name: string }) =>
              typeof label === 'string' ? label : label.id,
          ),
          note_pinned: data.note_pinned,
          note_title: data.note_title,
        }

      case ActionTypes.Task:
        return {
          task_assignees: data.task_assignees?.map(
            (assignee: string | { id: string }) => ({
              id: typeof assignee === 'string' ? assignee : assignee?.id,
            }),
          ),
          task_description: data.task_description,
          task_dueDate: data.task_dueDate,
          task_priority: data.task_priority,
          task_status: data.task_status,
          task_title: stripHtml(data.task_title ?? '', data.task_mention),
        }

      case ActionTypes.TeamChat:
        return {
          teamchat_message: data.teamchat_message,
        }

      case ActionTypes.Meeting:
        return {
          meeting_action_items: data.meeting_action_items,
          meeting_potential_strategies: data.meeting_potential_strategies,
          meeting_summary: data.meeting_summary,
        }

      default:
        return data
    }
  }

  const renderForm = () => {
    if (!recommendation.pulseId)
      return <Typography>Missing Pulse ID.</Typography>

    switch (recommendation.type) {
      case ActionTypes.Task:
        return <TaskForm pulseId={recommendation.pulseId} />

      case ActionTypes.Note:
        return <NoteForm pulseId={recommendation.pulseId} />

      case ActionTypes.TeamChat:
        return (
          <TeamChatForm
            pulseId={recommendation.pulseId}
            pulseName={recommendation.pulseName}
          />
        )

      case ActionTypes.Meeting:
        return <MeetingForm pulseId={recommendation.pulseId} />

      default:
        return (
          <Typography>{recommendation.type} is not supported yet.</Typography>
        )
    }
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Recommendation"
    >
      <FormProvider {...methods}>
        <Form
          maxWidth={false}
          noPadding={true}
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <Stack
            gap={2}
            sx={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header Section - Fixed at top */}
            <Stack gap={2} sx={{ flexShrink: 0 }}>
              <Stack
                alignItems="center"
                direction="row"
                divider={
                  <Circle
                    sx={{
                      color: 'divider',
                      fontSize: 10,
                    }}
                  />
                }
                gap={1}
              >
                {recommendation.type && <TypeChip type={recommendation.type} />}

                <Typography fontWeight="bold" variant="body2">
                  In: {recommendation.pulseName}
                </Typography>
              </Stack>

              <Stack px={1}>
                <Typography fontWeight="bold">{recommendation.name}</Typography>
                <Typography fontSize="small">
                  {recommendation.description}
                </Typography>
              </Stack>
            </Stack>

            {/* Dynamic Form Section - Scrollable */}
            {recommendation.pulseId && (
              <Stack
                border={1}
                borderRadius={2}
                gap={2}
                sx={{
                  borderColor: 'divider',
                  flex: 1,
                  overflowY: 'auto',
                  p: recommendation.type === ActionTypes.Note ? 0 : 2,
                }}
              >
                {renderForm()}
              </Stack>
            )}

            {/* Actions Section - Fixed at bottom */}
            <Stack
              alignItems="center"
              borderTop={1}
              direction="row"
              justifyContent="space-between"
              pt={2}
              sx={{
                borderColor: 'divider',
                flexShrink: 0,
              }}
            >
              <Button
                onClick={onClose}
                sx={{
                  color: 'text.secondary',
                }}
                type="button"
                variant="text"
              >
                Cancel
              </Button>

              <Stack alignItems="center" direction="row" gap={1}>
                <LoadingButton
                  disabled={isExecuting || !isDirty}
                  loading={isUpdating}
                  onClick={handleSubmit(onUpdate)}
                  type="button"
                  variant={isExecuting || !isDirty ? 'contained' : 'outlined'}
                >
                  Update Draft
                </LoadingButton>
                <LoadingButton
                  disabled={isUpdating}
                  loading={isExecuting}
                  type="submit"
                  variant="contained"
                >
                  Execute Action
                </LoadingButton>
              </Stack>
            </Stack>
          </Stack>
        </Form>
      </FormProvider>
    </CustomModal>
  )
}

import {
  ChatBubbleOutline,
  CheckCircleOutline,
  LightbulbOutlined,
  NorthEastOutlined,
  SummarizeOutlined,
  VolumeUpOutlined,
} from '@mui/icons-material'
import { Divider, Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import {
  ActionMethods,
  ActionTypes,
  LiveInsightRecommendation,
  Note,
  Task,
} from '@zunou-graphql/core/graphql'
import { useDismissRecommendationActionMutation } from '@zunou-queries/core/hooks/useDismissRecommendationActionMutation.ts'
import { useExecuteInsightRecommendationMutation } from '@zunou-queries/core/hooks/useExecuteInsightRecommendationMutation'
import { useGetNoteQuery } from '@zunou-queries/core/hooks/useGetNoteQuery'
import { useGetTaskQuery } from '@zunou-queries/core/hooks/useGetTaskQuery'
import { Button, Chip, LoadingButton } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

import TypeChip from './components/TypeChip'
import { ReviewModal } from './ReviewModal'

interface RecommendationCardProps {
  summary: string
  title: string
  insightId: string | undefined
  pulseId: string | undefined
  originatorPulseName: string | undefined
  id: string
  executed?: boolean
  actions?: LiveInsightRecommendation['actions']
  executedBy?: LiveInsightRecommendation['executedBy']
  executionResult?: LiveInsightRecommendation['execution_result_data']
}

const ACTION_CONFIG = {
  meeting: {
    executedLabels: {
      [ActionMethods.Create]: 'Saved as Meeting Summary',
      [ActionMethods.CreateSummary]: 'Saved as Meeting Summary',
      [ActionMethods.Delete]: 'Meeting Summary Deleted',
      [ActionMethods.Update]: 'Meeting Summary Updated',
      [ActionMethods.UpdateSummary]: 'Meeting Summary Updated',
      [ActionMethods.View]: 'View Meeting Summary',
    },
    icon: SummarizeOutlined,
    labels: {
      [ActionMethods.Create]: 'Save as Meeting Summary',
      [ActionMethods.CreateSummary]: 'Save as Meeting Summary',
      [ActionMethods.Delete]: 'Delete Meeting Summary',
      [ActionMethods.Update]: 'Update Meeting Summary',
      [ActionMethods.UpdateSummary]: 'Update Meeting Summary',
    },
  },
  note: {
    executedLabels: {
      [ActionMethods.Create]: 'Saved as Note',
      [ActionMethods.CreateSummary]: 'Saved as Note',
      [ActionMethods.Delete]: 'View Note',
      [ActionMethods.Update]: 'Note Updated',
      [ActionMethods.UpdateSummary]: 'Note Updated',
      [ActionMethods.View]: 'View Note',
    },
    icon: VolumeUpOutlined,
    labels: {
      [ActionMethods.Create]: 'Save as Note',
      [ActionMethods.CreateSummary]: 'Save as Note',
      [ActionMethods.Delete]: 'Delete Note',
      [ActionMethods.Update]: 'Update Note',
      [ActionMethods.UpdateSummary]: 'Update Note',
    },
  },
  task: {
    executedLabels: {
      [ActionMethods.Create]: 'Saved as Task',
      [ActionMethods.CreateSummary]: 'Saved as Task',
      [ActionMethods.Delete]: 'View Task',
      [ActionMethods.Update]: 'Task Updated',
      [ActionMethods.UpdateSummary]: 'Task Updated',
      [ActionMethods.View]: 'View Task',
    },
    icon: LightbulbOutlined,
    labels: {
      [ActionMethods.Create]: 'Save as Task',
      [ActionMethods.CreateSummary]: 'Save as Task',
      [ActionMethods.Delete]: 'Delete Task',
      [ActionMethods.Update]: 'Update Task',
      [ActionMethods.UpdateSummary]: 'Update Task',
    },
  },
  team_chat: {
    executedLabels: {
      [ActionMethods.Create]: 'Sent to Team Chat',
      [ActionMethods.CreateSummary]: 'Sent to Team Chat',
      [ActionMethods.Delete]: 'Message Deleted in Team Chat',
      [ActionMethods.Update]: 'Message Updated in Team Chat',
      [ActionMethods.UpdateSummary]: 'Message Updated in Team Chat',
      [ActionMethods.View]: 'View Message in Team Chat',
    },
    icon: ChatBubbleOutline,
    labels: {
      [ActionMethods.Create]: 'Send to Team Chat',
      [ActionMethods.CreateSummary]: 'Send to Team Chat',
      [ActionMethods.Delete]: 'Delete Message in Team Chat',
      [ActionMethods.Update]: 'Update Message in Team Chat',
      [ActionMethods.UpdateSummary]: 'Update Message in Team Chat',
    },
  },
} as const

const getIcon = (type?: ActionTypes) => {
  if (!type) return null
  const IconComponent = ACTION_CONFIG[type]?.icon
  return IconComponent ? (
    <IconComponent color="primary" fontSize="medium" />
  ) : null
}

// Helper function to transform action data based on type
const getInitialFormData = (
  type: ActionTypes | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actionData?: any,
  original?: {
    task?: Task
    note?: Note
  },
) => {
  if (!type || !actionData) return {}

  switch (type) {
    case ActionTypes.Note:
      return {
        note_description: actionData.content || original?.note?.content || '',
        note_labels: actionData.labels || original?.note?.labels || [],
        note_pinned:
          actionData.pinned !== undefined
            ? actionData.pinned
            : original?.note?.pinned ?? false,
        note_title: actionData.title || original?.note?.title || '',
      }

    case ActionTypes.Task:
      return {
        task_assignees:
          actionData?.assignees || original?.task?.assignees || [],
        task_description:
          actionData?.description || original?.task?.description || '',
        task_dueDate:
          actionData?.due_date ||
          actionData?.dueDate ||
          original?.task?.due_date ||
          '',
        task_id: actionData?.id ?? '',
        task_priority: actionData.priority || original?.task?.priority || '',
        task_status: actionData.status || original?.task?.status || '',
        task_title:
          actionData.title || original?.task?.title
            ? `<p>${actionData.title || original?.task?.title}</p>`
            : '<p><br></p>',
      }

    case ActionTypes.TeamChat: {
      const chatContent = actionData.content || actionData.message || ''

      // Check if content is already in SlateJS format
      const isSlateFormat =
        typeof chatContent === 'string' && chatContent.trim().startsWith('[')

      return {
        teamchat_message: isSlateFormat
          ? chatContent
          : chatContent
            ? JSON.stringify([
                {
                  children: [{ text: chatContent }],
                  type: 'paragraph',
                },
              ])
            : '',
      }
    }

    case ActionTypes.Meeting:
      return {
        meeting_action_items: actionData.action_items || [],
        meeting_potential_strategies: actionData.potential_strategies || [],
        meeting_summary: actionData.summary || '',
      }

    default:
      return {}
  }
}

export const RecommendationCard = ({
  summary,
  title,
  insightId,
  pulseId,
  id,
  actions,
  originatorPulseName,
  executed = false,
  executedBy,
  executionResult,
}: RecommendationCardProps) => {
  const navigate = useNavigate()
  const { userRole } = useAuthContext()

  const { organizationId } = useOrganization()
  const hasExecutionIds = executionResult?.ids && executionResult.ids.length > 0

  const redirectTo = hasExecutionIds ? executionResult.ids[0] : null

  const type = actions?.[0]?.type
  const method = actions?.[0]?.method
  const actionId = actions?.[0]?.id
  const actionData = actions?.[0]?.data

  // Add safety check for actionData?.id
  const hasActionDataId = Boolean(actionData?.id)

  const { data: taskData, isLoading: isLoadingTask } = useGetTaskQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(
      hasActionDataId &&
        type === ActionTypes.Task &&
        method === ActionMethods.Update,
    ),
    variables: {
      taskId: actionData?.id ?? '', // Safe fallback
    },
  })

  const { data: noteData, isLoading: isLoadingNote } = useGetNoteQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(
      hasActionDataId &&
        type === ActionTypes.Note &&
        method === ActionMethods.Update,
    ),
    variables: {
      taskId: actionData?.id ?? '', // Safe fallback
    },
  })

  const config = type ? ACTION_CONFIG[type] : null

  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const executeInsightRecommendationMutation =
    useExecuteInsightRecommendationMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const dismissRecommendationAction = useDismissRecommendationActionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleClick = async () => {
    if (executed) {
      toast.error('Recommendation has already been executed.')
      return
    }

    if (!insightId) {
      toast.error('Missing Insight ID.')
      return
    }

    if (!pulseId) {
      toast.error('Missing Pulse ID.')
      return
    }

    // Add validation for recommendation id
    if (!id) {
      toast.error('Missing Recommendation ID.')
      return
    }

    try {
      const response = await executeInsightRecommendationMutation.mutateAsync({
        insightId,
        organizationId,
        pulseId,
        recommendationId: id,
      })

      const { success, message } = response.executeInsightRecommendation

      if (success) {
        toast.success(message ?? 'Recommendation successfully executed.')
      } else {
        setIsReviewOpen(true)
        toast.error(message ?? 'Recommendation execution failed.')
      }
    } catch (error) {
      toast.error('An error occurred while executing the recommendation.')
      console.error('Recommendation execution error:', error)
    }
  }

  const getExecutedLabel = () => {
    if (!config || !method) return 'Executed'
    return config.executedLabels[method] ?? 'Executed'
  }

  const handleRedirect = () => {
    // Allow redirect for View/Delete methods if task_id or note_id exists with matching type
    const isViewOrDelete =
      method === ActionMethods.View || method === ActionMethods.Delete
    const hasValidTaskId =
      actionData?.task_id !== undefined && type === ActionTypes.Task
    const hasValidNoteId =
      actionData?.[0] !== undefined && type === ActionTypes.Note
    const hasMatchingTaskOrNoteId = hasValidTaskId || hasValidNoteId

    // If no type, always return early
    if (!type) return

    // Return early only if we don't have execution IDs AND it's not a valid View/Delete case
    if (!hasExecutionIds && !(isViewOrDelete && hasMatchingTaskOrNoteId)) {
      return
    }

    const selectedId = isViewOrDelete
      ? (type === ActionTypes.Task && actionData?.task_id) ||
        (type === ActionTypes.Note && actionData?.[0]) ||
        null
      : redirectTo

    if (!selectedId) {
      toast.error('Missing ID!')
      return
    }

    // Add validation for pulseId before navigation
    if (!pulseId) {
      toast.error('Missing Pulse ID for navigation!')
      return
    }

    const routeMap: Partial<Record<ActionTypes, Routes>> = {
      [ActionTypes.Note]: Routes.PulseNotes,
      [ActionTypes.Task]: Routes.PulseTasks,
      [ActionTypes.TeamChat]: Routes.PulseTeamChat,
      [ActionTypes.Meeting]: Routes.PulseDetail,
    }

    const pathname = routeMap[type]
    if (!pathname) return

    const query = {
      organizationId,
      pulseId,
      ...(type !== ActionTypes.Meeting && { id: selectedId }),
    }

    const path = pathFor({ pathname, query })

    navigate(`/${userRole}/${path}`)
  }

  const handleDismiss = () => {
    const actionId = actions?.[0]?.id

    if (!actionId) {
      toast.error('Missing action ID.')
      return
    }

    if (!insightId) {
      toast.error('Missing insight ID.')
      return
    }

    dismissRecommendationAction.mutateAsync(
      {
        insightId,
        recommendationActionsId: actionId,
      },
      {
        onError: () => toast.error('Recommendation dismiss failed.'),
        onSuccess: () => toast.success('Recommendation success dismissed.'),
      },
    )
  }

  // Get typed initial data based on action type
  const initialFormData = getInitialFormData(type, actionData, {
    note: noteData?.note,
    task: taskData?.task,
  })

  const renderActionButtons = () => {
    // Case 1: View method - Show Dismiss and View buttons
    if (!executed && method === ActionMethods.View) {
      return (
        <Stack alignItems="center" direction="row" gap={1}>
          <Button
            onClick={handleDismiss}
            size="medium"
            sx={{ color: 'text.secondary' }}
            variant="text"
          >
            Dismiss
          </Button>
          <Divider flexItem={true} orientation="vertical" sx={{ mr: 0.5 }} />
          <Button
            endIcon={<NorthEastOutlined />}
            onClick={handleRedirect}
            sx={{
              '& .MuiButton-endIcon': {
                '& > svg': { fontSize: 14 },
                fontSize: 14,
              },
            }}
            variant="text"
          >
            {getExecutedLabel()}
          </Button>
        </Stack>
      )
    }

    // Case 2: Delete method (not executed) - Show Dismiss, View, and Execute buttons
    if (!executed && method === ActionMethods.Delete) {
      return (
        <Stack alignItems="center" direction="row" gap={1}>
          <Button
            onClick={handleDismiss}
            size="medium"
            sx={{ color: 'text.secondary' }}
            variant="text"
          >
            Dismiss
          </Button>
          <Divider flexItem={true} orientation="vertical" sx={{ mr: 0.5 }} />
          <Button
            endIcon={<NorthEastOutlined />}
            onClick={handleRedirect}
            sx={{
              '& .MuiButton-endIcon': {
                '& > svg': { fontSize: 14 },
                fontSize: 14,
              },
            }}
            variant="text"
          >
            {getExecutedLabel()}
          </Button>
          <LoadingButton
            loading={executeInsightRecommendationMutation.isPending}
            onClick={handleClick}
            size="medium"
            variant="contained"
          >
            Execute
          </LoadingButton>
        </Stack>
      )
    }

    // Case 3: Executed (not delete method) - Show View button
    if (executed && method !== ActionMethods.Delete) {
      return (
        <Button
          endIcon={<NorthEastOutlined />}
          onClick={handleRedirect}
          sx={{
            '& .MuiButton-endIcon': {
              '& > svg': { fontSize: 14 },
              fontSize: 14,
            },
          }}
          variant="text"
        >
          {getExecutedLabel()}
        </Button>
      )
    }

    // Case 4: Executed without execution IDs or executed delete method - Show nothing
    if (
      (executed && !hasExecutionIds) ||
      (executed && method === ActionMethods.Delete)
    ) {
      return null
    }

    // Case 5: Default - Show Dismiss, Review, and Execute buttons
    return (
      <Stack alignItems="center" direction="row" gap={1}>
        <Button
          onClick={handleDismiss}
          size="medium"
          sx={{ color: 'text.secondary' }}
          variant="text"
        >
          Dismiss
        </Button>
        <Divider flexItem={true} orientation="vertical" sx={{ mr: 0.5 }} />
        <Button
          onClick={() => setIsReviewOpen(true)}
          size="medium"
          variant="outlined"
        >
          Review
        </Button>
        <LoadingButton
          loading={executeInsightRecommendationMutation.isPending}
          onClick={handleClick}
          size="medium"
          variant="contained"
        >
          Execute
        </LoadingButton>
      </Stack>
    )
  }

  // Add safety check for actionData.id existence
  if ((isLoadingTask || isLoadingNote) && hasActionDataId)
    return (
      <Stack height="100%" width="100%">
        <LoadingSkeleton height={80} />
      </Stack>
    )

  return (
    <>
      <Stack
        alignItems="center"
        border={1}
        direction="row"
        gap={4}
        justifyContent="space-between"
        sx={{
          bgcolor: alpha(theme.palette.primary.light, 0.05),
          borderColor: 'divider',
          borderRadius: 2,
          paddingX: 3,
          paddingY: 2,
          transition: 'background-color 0.2s',
        }}
        tabIndex={0}
      >
        <Stack alignItems="center" direction="row" gap={2} height="100%">
          <Stack height="100%">{getIcon(type)}</Stack>
          <Stack gap={2}>
            <Stack gap={0.5}>
              <Stack alignItems="start" direction="column" gap={1}>
                <Stack alignItems="center" direction="row" gap={1}>
                  {executed && (
                    <Chip
                      icon={<CheckCircleOutline sx={{ fontSize: '1rem' }} />}
                      label="DONE"
                      size="small"
                      sx={{
                        '& .MuiChip-icon': {
                          color: 'inherit',
                          fontSize: '1rem',
                        },
                        '& .MuiChip-label': {
                          fontSize: '0.75rem',
                        },
                        bgcolor: theme.palette.common.lime,
                        color: 'common.white',
                        px: 0.5,
                        width: 'fit-content',
                      }}
                    />
                  )}
                  {type && <TypeChip type={type} />}
                </Stack>
                <Typography fontWeight="bold" variant="body2">
                  {title}
                </Typography>
              </Stack>
              <Typography color="text.secondary" maxWidth={550} variant="body2">
                {summary}
              </Typography>
            </Stack>
            {executedBy && (
              <Stack alignItems="center" direction="row" gap={1}>
                <Typography color="text.secondary" fontSize="small">
                  Executed by
                </Typography>

                <Stack alignItems="center" direction="row" gap={1}>
                  <Avatar
                    placeholder={executedBy.name}
                    size="extraSmall"
                    src={executedBy.gravatar}
                    variant="circular"
                  />
                  <Typography color="text.secondary" fontSize="small">
                    {executedBy.name}
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Stack>

        {renderActionButtons()}
      </Stack>
      {isReviewOpen && (
        <ReviewModal
          initialData={initialFormData}
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          recommendation={{
            actionId: actionId ?? '',
            description: summary,
            id,
            insightId: insightId ?? '',
            method,
            name: title,
            organizationId,
            pulseId: pulseId ?? '',
            pulseName: originatorPulseName ?? 'Unknown',
            type: type ?? ActionTypes.Note,
          }}
        />
      )}
    </>
  )
}

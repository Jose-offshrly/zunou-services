import {
  Check,
  ChecklistOutlined,
  ContentCopyOutlined,
  EditOutlined,
  ErrorOutlineOutlined,
  NotificationImportant,
  SmartToyOutlined,
} from '@mui/icons-material'
import {
  CircularProgress,
  IconButton,
  ListItem,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, lighten } from '@mui/system'
import {
  DataSourceOrigin,
  NotificationKind,
  NotificationType,
  Scalars,
  TaskEntity,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useCreateNotificationMutation } from '@zunou-queries/core/hooks/useCreateNotificationMutation'
import { useCreateTaskMutation } from '@zunou-queries/core/hooks/useCreateTaskMutation'
import { useGetDataSourceQuery } from '@zunou-queries/core/hooks/useGetDataSourceQuery'
import { useGetDataSourceUrlQuery } from '@zunou-queries/core/hooks/useGetDataSourceUrlQuery'
import { useGetSummaryQuery } from '@zunou-queries/core/hooks/useGetSummaryQuery'
import { LoadingButton } from '@zunou-react/components/form'
import { AttachmentData } from '@zunou-react/components/form/AttachmentItem'
import { ContentType } from '@zunou-react/components/form/FormattedContent'
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
} from '@zunou-react/components/layout'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { theme } from '@zunou-react/services/Theme'
import { UserRoleType } from '@zunou-react/types/role'
import { Maybe } from 'graphql/jsutils/Maybe'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { useParams } from 'react-router-dom'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import { formatDateTime } from '~/utils/formatDate'

import SummaryMetadata from './components/SummaryMetadata'

interface PulseChatSideTrayProps {
  onClose: () => void
  pulseId: string
  organizationId: string
  attachment: AttachmentData
  attachmentType?: ContentType | null
}

interface MeetingSummaryType {
  title: string
  organizer: {
    email: string
    name: string
  }
  date: string // Consider using Date if parsing is needed
  duration: number
  meeting_link: string
  transcript_url: string
  participants: string[]
  overview: string[]
  keywords: string[]
  strategies: string[]
}

const statusMap: { [key: string]: TaskStatus } = {
  DONE: TaskStatus.Completed,
  'IN PROGRESS': TaskStatus.Inprogress,
  'NOT STARTED': TaskStatus.Todo,
}

const DataSourceContent = ({
  attachment,
  organizationId,
  pulseId,
  onClose,
}: {
  attachment: AttachmentData
  organizationId: string
  pulseId: string
  onClose: () => void
}) => {
  /**
   * run this first
   */
  const { data: dataSourceInfo, isLoading } = useGetDataSourceQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId: organizationId,
      pulseId: pulseId,
      ...(attachment.data_source_id
        ? { dataSourceId: attachment.data_source_id }
        : {}),
    },
  })

  const { data, isLoading: isLoadingDataSource } = useGetDataSourceUrlQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: attachment.data_source_id
      ? { dataSourceId: attachment.data_source_id }
      : {},
  })

  const mimeType = data?.signedDataSourceUrl.mime
  const dataSourceUrl = data?.signedDataSourceUrl.url
  const displayText = attachment.text || 'No content available'

  let cardTitle = ''
  if (
    dataSourceInfo &&
    dataSourceInfo.dataSource?.origin === DataSourceOrigin.Meeting &&
    dataSourceInfo.dataSource.summary
  ) {
    cardTitle = 'Meeting Preview'
  } else {
    cardTitle = mimeType ? `${mimeType?.toUpperCase()} Preview` : 'Preview'
  }

  return isLoading || isLoadingDataSource ? (
    <LoadingSpinner />
  ) : (
    <>
      <CardHeader onClose={onClose} title={cardTitle} />
      <CardContent sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {mimeType === 'mp4' && (
          <Stack
            marginBottom={2}
            paddingTop="56.25%"
            position="relative"
            width="100%"
          >
            {isLoadingDataSource && (
              <Stack
                left="50%"
                position="absolute"
                sx={{ transform: 'translate(-50%, -50%)' }}
                top="50%"
              >
                <CircularProgress />
              </Stack>
            )}
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen={true}
              loading="lazy"
              src={dataSourceUrl}
              style={{
                border: 'none',
                borderRadius: '6px',
                height: '100%',
                left: 0,
                position: 'absolute',
                top: 0,
                width: '100%',
              }}
              title="Video player"
            />
          </Stack>
        )}
        {dataSourceInfo &&
        dataSourceInfo.dataSource?.origin === DataSourceOrigin.Meeting ? (
          <MeetingDataSourceContent
            summary={dataSourceInfo.dataSource.summary}
          />
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayText.trim()}
          </ReactMarkdown>
        )}
      </CardContent>
    </>
  )
}

const MeetingDataSourceContent = ({
  summary,
}: {
  summary?: Maybe<Scalars['String']['output']>
}) => {
  if (!summary) return

  const parsedSummary: MeetingSummaryType = JSON.parse(summary)

  let keywords = ''
  for (const element of parsedSummary.keywords) {
    const word = element.replace(/\b\w/g, (char: string) => char.toUpperCase())
    keywords += `<span style="display: inline-block; border: 1px solid #6b34d1; background-color: rgb(236, 228, 255); color: #6b34d1; padding: 6px 12px; border-radius: 16px; font-size: 14px; font-weight: 500; margin: 4px;">${word}</span>`
  }

  let overviews = ''
  for (const element of parsedSummary.overview) {
    overviews += `- ${element}\n`
  }

  const buildMarkdown = `
  <style>
    h2 { margin: 0; }
  </style>

  ## **${parsedSummary.title}**  
  **${formatDateTime(parsedSummary.date)}** | *English (Global)* 

  ${keywords}

  ### Overview
  ${overviews}
  `

  return (
    <>
      <div
        className="min-h-full"
        style={{ maxHeight: '100%', overflowY: 'auto' }}
      >
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
          {buildMarkdown}
        </ReactMarkdown>
      </div>
    </>
  )
}

export enum SideTrayTarget {
  SUMMARY = 'SUMMARY',
  STRATEGIES = 'STRATEGIES',
  ACTION_ITEMS = 'ACTION_ITEMS',
}
const SummaryContent = ({
  attachment,
  onClose,
  userRole,
  attachmentType = null,
}: {
  attachment: AttachmentData
  onClose: () => void
  userRole: UserRoleType | undefined
  attachmentType?: ContentType | null
}) => {
  const [isNotified, setIsNotified] = useState(false)
  const [isTaskCreated, setIsTaskCreated] = useState(false)

  // Create refs for each potential target section
  const summaryRef = useRef<HTMLDivElement>(null)
  const strategiesRef = useRef<HTMLDivElement>(null)
  const actionItemsRef = useRef<HTMLDivElement>(null)

  const { pulseId } = useParams()
  const { organizationId } = useOrganization()

  const { data, isLoading: isLoadingSummary } = useGetSummaryQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { summaryId: attachment.summary_id },
  })

  // Scrolls to target when component mounts or data loads
  useEffect(() => {
    const target = getTarget(attachmentType)

    const scrollToTarget = () => {
      switch (target) {
        case SideTrayTarget.SUMMARY:
          summaryRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
          break
        // case SideTrayTarget.STRATEGIES:
        //   strategiesRef.current?.scrollIntoView({
        //     behavior: 'smooth',
        //     block: 'start',
        //   })
        //   break
        case SideTrayTarget.ACTION_ITEMS:
          actionItemsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
          break
      }
    }

    const timer = setTimeout(scrollToTarget, 300)

    return () => clearTimeout(timer) // Cleanup timer
  }, [data])

  const { mutate: createNotification, isPending: isLoadingCreateNotification } =
    useCreateNotificationMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutateAsync: createTask, isPending: isPendingCreateTask } =
    useCreateTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const {
    date = '',
    name = '',
    summary = '',
    potential_strategies = [],
    action_items = [],
    pulse_id = '',
    id = '',
    attendees,
  } = data?.summary ?? {}

  // If item has a falsy is_existing value it should be included
  const newActionItems = useMemo(() => {
    return (data?.summary?.action_items || []).filter(
      (item) => !item?.is_existing,
    )
  }, [data?.summary])

  const notifyHandler = () => {
    createNotification(
      {
        description: `${name} available`,
        kind: NotificationKind.SummaryOption,
        notifiableId: pulse_id,
        summaryId: id,
        type: NotificationType.Pulse,
      },
      {
        onError: () => {
          toast.error('Failed to send notification')
        },
        onSuccess: () => {
          toast.success('Notification sent')
          setIsNotified(true)
        },
      },
    )
  }

  const createTaskHandler = async () => {
    if (!pulseId || !data?.summary.data_source_id) {
      toast.error('Missing pulse ID or data source ID.')
      return
    }

    // Create List
    const createdTaskList = await createTask([
      {
        entity_id: pulseId,
        entity_type: TaskEntity.Pulse,
        organization_id: organizationId,
        source: {
          id: data.summary.data_source_id,
          type: TaskSource.Meeting,
        },
        task_type: TaskType.List,
        title: name + ' Tasks',
      },
    ]).then((res) => res.createTask[0])

    if (!createdTaskList) {
      toast.error('Failed to create task list for task')
      return
    }

    // Create task under the created list
    createTask(
      newActionItems.map((item) => {
        const normalizedStatus = item?.status?.toUpperCase()
        return {
          assignees: item?.assignees
            ?.map((assignee) => assignee?.id ?? null)
            .filter(Boolean),
          description: item?.description,
          entity_id: pulseId,
          entity_type: TaskEntity.Pulse,
          organization_id: organizationId,
          parent_id: createdTaskList.id,
          priority: item?.priority?.toUpperCase() as TaskPriority,
          source: {
            id: data.summary.data_source_id,
            type: TaskSource.Meeting,
          },
          status:
            normalizedStatus && statusMap[normalizedStatus]
              ? statusMap[normalizedStatus]
              : TaskStatus.Todo,
          task_type: TaskType.Task,
          title: item?.title ?? 'Task',
        }
      }),
      {
        onError: () => {
          toast.error('Failed to create task')
        },
        onSuccess: () => {
          toast.success('Tasks created!')
          setIsTaskCreated(true)
        },
      },
    )
  }

  const getTarget = (type: ContentType | null) => {
    if (!type) return SideTrayTarget.SUMMARY

    if (type === ContentType.ReviewTasks) return SideTrayTarget.ACTION_ITEMS
  }

  return isLoadingSummary ? (
    <Stack alignItems="center" height="100%" justifyContent="center">
      <LoadingSpinner />
      <Typography variant="subtitle1">Loading summary...</Typography>
    </Stack>
  ) : !isLoadingSummary && !data ? (
    <>
      <CardHeader onClose={onClose} title="Failed to fetch summary" />
      <Stack alignItems="center" gap={1} height="100%" justifyContent="center">
        <ErrorOutlineOutlined color="error" />
        <Typography variant="subtitle1">No summary.</Typography>
      </Stack>
    </>
  ) : (
    <>
      <CardHeader
        onClose={onClose}
        subheader={
          <SummaryMetadata
            attendees={(attendees as string[]) ?? []}
            date={date}
          />
        }
        title={name}
      />
      <CardContent sx={{ flex: 1, overflowY: 'auto' }}>
        <Stack spacing={3}>
          {/* SUMMARY */}
          <Stack ref={summaryRef}>
            <Typography
              fontWeight="bold"
              gutterBottom={true}
              variant="subtitle1"
            >
              Summary
            </Typography>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {summary.trim()}
            </ReactMarkdown>
          </Stack>
          {/* STRATEGIES */}
          {potential_strategies.length > 0 && (
            <Stack
              ref={strategiesRef}
              sx={{
                gap: 1,
                p: 2,
              }}
            >
              <Stack alignItems="center" direction="row" gap={1}>
                <SmartToyOutlined
                  fontSize="medium"
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '50%',
                    color: 'white',
                    p: 0.5,
                  }}
                />
                <Typography fontWeight="bold" variant="subtitle1">
                  Potential Strategy
                </Typography>
              </Stack>
              <Typography component="ul" sx={{ pl: 3 }}>
                {potential_strategies.map((strategy, index) => (
                  <li key={index}>{strategy}</li>
                ))}
              </Typography>
            </Stack>
          )}
          {/* ACTION_ITEMS */}
          {action_items.length > 0 && (
            <Stack ref={actionItemsRef} sx={{ gap: 1, p: 2 }}>
              <Stack alignItems="center" direction="row" gap={1}>
                <SmartToyOutlined
                  fontSize="medium"
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '50%',
                    color: 'white',
                    p: 0.5,
                  }}
                />
                <Typography fontWeight="bold" variant="subtitle1">
                  Action Items
                </Typography>
              </Stack>
              <Typography
                component="ol"
                sx={{
                  '& li::marker': {
                    fontWeight: 'bold',
                  },
                  listStyleType: 'lower-alpha',
                  pl: 3,
                }}
              >
                {action_items.map((item, index) => {
                  const details = []

                  if (item?.due_date) details.push(`Due Date: ${item.due_date}`)
                  if (item?.status) details.push(`Status: ${item.status}`)
                  if (item?.priority) details.push(`Priority: ${item.priority}`)

                  return (
                    <ListItem
                      component="li"
                      disableGutters={true}
                      key={index}
                      sx={{
                        color: item?.is_existing
                          ? 'text.secondary'
                          : 'text.primary',
                        display: 'list-item',
                        p: 0,
                        textDecoration: item?.is_existing
                          ? 'line-through'
                          : undefined,
                      }}
                    >
                      <Typography component="span" sx={{ fontWeight: 'bold' }}>
                        {`${item?.title} ${item?.assignees ? `(${item.assignees.map((assignee) => assignee?.name).join(', ')})` : ''}`}
                      </Typography>
                      {item?.description && ` - ${item.description}`}
                      {details.length > 0 && ` (${details.join(', ')})`}
                    </ListItem>
                  )
                })}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Stack alignItems="center" direction="row" gap={1}>
          <IconButton
            disabled={true}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <ContentCopyOutlined fontSize="small" />
          </IconButton>
          <IconButton
            disabled={true}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <EditOutlined fontSize="small" />
          </IconButton>
        </Stack>
        <Stack alignItems="center" direction="row" gap={1}>
          {action_items.length > 0 && (
            <LoadingButton
              disableElevation={true}
              disabled={
                isPendingCreateTask ||
                isTaskCreated ||
                newActionItems.length === 0
              }
              loading={isPendingCreateTask}
              onClick={createTaskHandler}
              startIcon={
                isTaskCreated ? (
                  <Check
                    fontSize="small"
                    sx={{ color: lighten(theme.palette.primary.main, 0.5) }}
                  />
                ) : (
                  <ChecklistOutlined fontSize="small" />
                )
              }
              sx={{
                '&.Mui-disabled:not(.MuiLoadingButton-loading)': {
                  backgroundColor: (theme) => theme.palette.grey[300],
                  borderColor: () => 'transparent',
                  color: (theme) => theme.palette.grey[400],
                },
                backgroundColor: 'transparent',
                borderColor: 'primary.main',
                color: 'primary.main',
              }}
              type="button"
              variant="outlined"
            >
              {newActionItems.length === 0 || isTaskCreated
                ? 'Tasks Created'
                : 'Create Tasks'}
            </LoadingButton>
          )}

          {userRole === UserRoleEnum.MANAGER && (
            <LoadingButton
              disableElevation={true}
              disabled={isLoadingCreateNotification || isNotified}
              loading={isLoadingCreateNotification}
              onClick={notifyHandler}
              startIcon={
                isNotified ? (
                  <Check
                    fontSize="small"
                    sx={{ color: lighten(theme.palette.primary.main, 0.5) }}
                  />
                ) : (
                  <NotificationImportant fontSize="small" />
                )
              }
              sx={{
                backgroundColor: isNotified
                  ? lighten(theme.palette.primary.main, 0.2)
                  : 'primary',
                color: isNotified ? theme.palette.primary.main : 'white',
              }}
              type="button"
              variant="contained"
            >
              {isNotified ? 'Notified' : 'Notify'}
            </LoadingButton>
          )}
        </Stack>
      </CardActions>
    </>
  )
}

export const PulseChatSideTray = ({
  onClose,
  organizationId,
  pulseId,
  attachment,
  attachmentType,
}: PulseChatSideTrayProps) => {
  const { userRole } = useAuthContext()
  if (!attachment.data_source_id && !attachment.summary_id) return null

  const cardContent = attachment.summary_id ? (
    <SummaryContent
      attachment={attachment}
      attachmentType={attachmentType}
      key={attachment.summary_id}
      onClose={onClose}
      userRole={userRole}
    />
  ) : (
    <DataSourceContent
      attachment={attachment}
      onClose={onClose}
      organizationId={organizationId}
      pulseId={pulseId}
    />
  )

  return (
    <Card
      sx={{
        backgroundColor: alpha(theme.palette.muted.main, 0.05),
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      {cardContent}
    </Card>
  )
}

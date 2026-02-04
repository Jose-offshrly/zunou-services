import {
  CheckCircleOutline,
  Circle,
  CircleOutlined,
  ExpandMore,
  Flag,
} from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  AvatarGroup,
  Box,
  Stack,
  Typography,
} from '@mui/material'
import { Task, TaskStatus, TaskType } from '@zunou-graphql/core/graphql'
import dayjs from 'dayjs'

import { getPulseTaskPriorityColor } from '~/utils/getPulseTaskPriorityColor'

interface Props {
  task: Task
  onClick?: (taskId: string) => void
}

export default function OverdueCard({ task, onClick }: Props) {
  const AVATAR_SIZE = 20

  const formatDueDate = (date?: string) => {
    if (!date) return null
    return dayjs(date).format('MMM D')
  }

  const getLatestDueDate = (children?: Task[]) => {
    if (!children || children.length === 0) return null

    const dueDates = children
      .map((child) => child.due_date)
      .filter((date): date is string => !!date)

    if (dueDates.length === 0) return null

    const latestDate = dueDates.reduce((latest, current) => {
      return dayjs(current).isAfter(dayjs(latest)) ? current : latest
    })

    return dayjs(latestDate).format('MMM D')
  }

  const renderTaskContent = (taskItem: Task, isChild = false) => (
    <Stack
      alignItems="center"
      direction="row"
      gap={2}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(taskItem.id)
      }}
      sx={{
        cursor: 'pointer',
        pl: isChild ? '8px' : '8px',
        pr: 0,
        py: 1.5,
      }}
    >
      <Stack flex={1} gap={0.5}>
        <Stack alignItems="center" direction="row" gap={1}>
          {taskItem.status === TaskStatus.Completed ? (
            <CheckCircleOutline
              sx={{
                color: 'common.lime',
                fontSize: 14,
              }}
            />
          ) : (
            <CircleOutlined
              sx={{
                color: 'text.secondary',
                fontSize: 14,
              }}
            />
          )}
          <Typography fontWeight={500} variant="body2">
            {taskItem.title}
          </Typography>
        </Stack>

        <Stack
          alignItems="center"
          direction="row"
          gap={2}
          justifyContent="space"
          width="100%"
        >
          {taskItem.due_date ? (
            <Stack alignItems="center" direction="row" gap={0.5}>
              <Flag sx={{ color: '#ef4444', fontSize: 14 }} />
              <Typography
                sx={{ color: '#ef4444', fontWeight: 500 }}
                variant="caption"
              >
                Due {formatDueDate(taskItem.due_date)}
              </Typography>
            </Stack>
          ) : (
            <Typography
              sx={{ color: 'text.secondary', fontWeight: 500 }}
              variant="caption"
            >
              No due date
            </Typography>
          )}

          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            sx={{ marginLeft: 'auto' }}
          >
            {taskItem.priority && (
              <Stack alignItems="center" direction="row" gap={0.5}>
                <Flag
                  sx={{
                    color: getPulseTaskPriorityColor(taskItem.priority),
                    fontSize: 14,
                  }}
                />
                <Typography
                  sx={{
                    color: getPulseTaskPriorityColor(taskItem.priority),
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                  variant="caption"
                >
                  {taskItem.priority?.toLowerCase()}
                </Typography>
              </Stack>
            )}

            <Box>
              {taskItem.assignees && taskItem.assignees.length > 0 ? (
                <AvatarGroup
                  componentsProps={{
                    additionalAvatar: {
                      sx: {
                        fontSize: 10,
                        height: AVATAR_SIZE,
                        width: AVATAR_SIZE,
                      },
                    },
                  }}
                  max={3}
                  renderSurplus={(surplus) => (
                    <Avatar
                      sx={{
                        fontSize: 10,
                        height: AVATAR_SIZE,
                        width: AVATAR_SIZE,
                      }}
                    >
                      +{surplus}
                    </Avatar>
                  )}
                  sx={{
                    '& .MuiAvatar-root': {
                      fontSize: 10,
                      height: AVATAR_SIZE,
                      marginLeft: '-8px',
                      marginRight: 0,
                      width: AVATAR_SIZE,
                    },
                    flexDirection: 'row-reverse',
                    justifyContent: 'flex-end',
                  }}
                >
                  {taskItem.assignees?.map((assignee) => (
                    <Avatar
                      key={assignee.user.id}
                      sizes="small"
                      src={assignee.user.gravatar ?? undefined}
                      sx={{
                        fontSize: 10,
                        height: AVATAR_SIZE,
                        width: AVATAR_SIZE,
                      }}
                    >
                      {assignee.user.name}
                    </Avatar>
                  ))}
                </AvatarGroup>
              ) : (
                <Box
                  sx={{
                    color: 'text.secondary',
                    fontSize: 12,
                  }}
                >
                  <Typography variant="caption">Unassigned</Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )

  if (
    task.type === TaskType.List &&
    task.children &&
    task.children.length > 0
  ) {
    return (
      <Accordion
        defaultExpanded={true}
        disableGutters={true}
        sx={{
          '&.Mui-expanded': {
            margin: 0,
          },
          '&:before': {
            display: 'none',
          },
          bgcolor: 'transparent',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        <AccordionSummary
          expandIcon={
            <ExpandMore sx={{ color: 'text.secondary', fontSize: 14 }} />
          }
          sx={{
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              margin: '12px 0',
            },
            '& .MuiAccordionSummary-content.Mui-expanded': {
              margin: '12px 0',
            },
            '& .MuiAccordionSummary-expandIconWrapper': {
              marginLeft: 0,
              marginRight: 1,
            },
            '&.Mui-expanded': {
              minHeight: 'auto',
            },
            flexDirection: 'row-reverse',
            minHeight: 'auto',
            padding: 0,
            pl: '8px',
          }}
        >
          <Stack
            alignItems="center"
            direction="row"
            flex={1}
            gap={2}
            justifyContent="space-between"
          >
            <Typography color="text.primary" fontWeight={500} variant="body2">
              {task.title}
            </Typography>

            <Stack
              alignItems="center"
              direction="row"
              divider={
                <Circle
                  sx={{
                    color: 'divider',
                    fontSize: 7,
                  }}
                />
              }
              gap={1.5}
            >
              {(task.due_date || getLatestDueDate(task.children)) && (
                <Stack alignItems="center" direction="row" gap={0.5}>
                  <Flag sx={{ color: '#ef4444', fontSize: 14 }} />
                  <Typography
                    sx={{ color: '#ef4444', fontWeight: 500 }}
                    variant="caption"
                  >
                    Due{' '}
                    {task.due_date
                      ? formatDueDate(task.due_date)
                      : getLatestDueDate(task.children)}
                  </Typography>
                </Stack>
              )}

              <Typography
                color="text.secondary"
                fontWeight={500}
                variant="caption"
              >
                {task.children.length}
              </Typography>
            </Stack>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: '0 0 0 32px' }}>
          <Stack>
            {task.children.map((child) => (
              <Box key={child.id}>{renderTaskContent(child, true)}</Box>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
    )
  }

  return renderTaskContent(task)
}

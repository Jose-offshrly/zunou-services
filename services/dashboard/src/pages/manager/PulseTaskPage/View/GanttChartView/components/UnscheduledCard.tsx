import { CheckCircleOutline, CircleOutlined, Flag } from '@mui/icons-material'
import { Avatar, AvatarGroup, Box, Stack, Typography } from '@mui/material'
import { Task, TaskStatus, TaskType } from '@zunou-graphql/core/graphql'
import { Chip } from '@zunou-react/components/form'

import { getPulseTaskPriorityColor } from '~/utils/getPulseTaskPriorityColor'

interface Props {
  task: Task
  onClick?: (taskId: string) => void
}

export default function UnscheduledCard({ task, onClick }: Props) {
  const AVATAR_SIZE = 20

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
          justifyContent="space-between"
          width="100%"
        >
          <Stack alignItems="center" direction="row" gap={1}>
            {taskItem.priority && (
              <Chip
                icon={
                  <Flag
                    sx={{
                      fontSize: 14,
                    }}
                  />
                }
                label={taskItem.priority.toLowerCase()}
                size="small"
                sx={{
                  '& .MuiChip-icon': {
                    color: getPulseTaskPriorityColor(taskItem.priority),
                    fontSize: 14,
                  },
                  backgroundColor: `${getPulseTaskPriorityColor(taskItem.priority)}20`,
                  borderRadius: 1,
                  color: getPulseTaskPriorityColor(taskItem.priority),
                  fontSize: 11,
                  fontWeight: 500,
                  height: 20,
                  textTransform: 'capitalize',
                }}
              />
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
      <>
        {task.children.map((child) => (
          <Box key={child.id}>{renderTaskContent(child, false)}</Box>
        ))}
      </>
    )
  }

  return renderTaskContent(task)
}

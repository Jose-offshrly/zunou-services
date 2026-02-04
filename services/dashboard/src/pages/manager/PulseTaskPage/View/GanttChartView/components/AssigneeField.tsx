import { Avatar, AvatarGroup, Box, Typography } from '@mui/material'
import { Task, TaskType } from '@zunou-graphql/core/graphql'
import { memo, useMemo } from 'react'

interface AssigneeFieldProps {
  task: Task
  disabled?: boolean
  onClick: (e: React.MouseEvent<HTMLElement>) => void
}

const AVATAR_SIZE = 20

// Static styles moved outside component
const containerSx = { cursor: 'pointer' }
const avatarGroupSx = {
  '& .MuiAvatar-root': {
    fontSize: 10,
    height: AVATAR_SIZE,
    marginLeft: '-8px',
    marginRight: 0,
    width: AVATAR_SIZE,
  },
  flexDirection: 'row-reverse' as const,
  justifyContent: 'flex-end',
}
const avatarSx = {
  fontSize: 10,
  height: AVATAR_SIZE,
  width: AVATAR_SIZE,
}
const unassignedSx = {
  '&:hover': {
    textDecoration: 'underline',
  },
  color: 'text.secondary',
  fontSize: 12,
}

export const AssigneeField = memo(
  ({ task, disabled = false, onClick }: AssigneeFieldProps) => {
    if (task.type !== TaskType.Task) {
      return <>-</>
    }

    const hasAssignees = task.assignees && task.assignees.length > 0

    const additionalAvatarProps = useMemo(
      () => ({
        additionalAvatar: {
          sx: avatarSx,
        },
      }),
      [],
    )

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      if (disabled) return
      onClick(e)
    }

    return (
      <Box
        onClick={handleClick}
        sx={{
          ...containerSx,
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {hasAssignees ? (
          <AvatarGroup
            componentsProps={additionalAvatarProps}
            max={3}
            renderSurplus={(surplus) => (
              <Avatar sx={avatarSx}>+{surplus}</Avatar>
            )}
            sx={avatarGroupSx}
          >
            {task.assignees?.map((assignee) => (
              <Avatar
                key={assignee.user.id}
                sizes="small"
                src={assignee.user.gravatar ?? undefined}
                sx={avatarSx}
              >
                {assignee.user.name}
              </Avatar>
            ))}
          </AvatarGroup>
        ) : (
          <Box sx={unassignedSx}>
            <Typography variant="caption">Unassigned</Typography>
          </Box>
        )}
      </Box>
    )
  },
)

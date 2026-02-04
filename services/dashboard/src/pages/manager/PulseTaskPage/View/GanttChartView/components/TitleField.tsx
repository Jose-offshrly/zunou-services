import {
  EditOutlined,
  KeyboardArrowDown,
  KeyboardArrowRight,
} from '@mui/icons-material'
import { Box, TextField, Tooltip, Typography } from '@mui/material'
import { Task, TaskType } from '@zunou-graphql/core/graphql'
import { IconButton } from '@zunou-react/components/form'
import { memo } from 'react'

interface TitleFieldProps {
  task: Task
  isCollapsed: boolean
  isEditing: boolean
  editedValue: string
  disabled?: boolean
  onToggleCollapse: () => void
  onClick: () => void
  onChange: (value: string) => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

const ICON_SIZE_MEDIUM = 16

const editableHoverStyles = {
  '& .edit-icon': {
    opacity: 1,
  },
  textDecoration: 'underline',
}

const hiddenIconStyles = {
  flexShrink: 0,
  opacity: 0,
  transition: 'opacity 0.2s',
}

export const TitleField = memo(
  ({
    task,
    isCollapsed,
    isEditing,
    editedValue,
    disabled = false,
    onToggleCollapse,
    onClick,
    onChange,
    onBlur,
    onKeyDown,
  }: TitleFieldProps) => {
    const handleToggleCollapse = (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleCollapse()
    }

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (disabled) return
      onClick()
    }

    if (task.type === TaskType.List) {
      return (
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <IconButton
            onClick={handleToggleCollapse}
            size="small"
            sx={{
              flexShrink: 0,
              mr: 0.5,
              padding: 0.25,
            }}
          >
            {isCollapsed ? (
              <KeyboardArrowRight fontSize="small" />
            ) : (
              <KeyboardArrowDown fontSize="small" />
            )}
          </IconButton>
          {isEditing ? (
            <TextField
              autoFocus={true}
              onBlur={onBlur}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              size="small"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: 'inherit',
                  fontWeight: 600,
                },
                flex: 1,
              }}
              value={editedValue}
            />
          ) : (
            <Tooltip arrow={true} title={task.title}>
              <Box
                onClick={handleClick}
                sx={{
                  '&:hover': disabled ? {} : editableHoverStyles,
                  alignItems: 'center',
                  cursor: disabled ? 'default' : 'pointer',
                  display: 'flex',
                  fontWeight: 600,
                  gap: 0.5,
                  opacity: disabled ? 0.5 : 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  variant="caption"
                >
                  {task.title}
                </Typography>
                <EditOutlined
                  className="edit-icon"
                  sx={{
                    fontSize: ICON_SIZE_MEDIUM,
                    ...hiddenIconStyles,
                  }}
                />
              </Box>
            </Tooltip>
          )}
        </Box>
      )
    }

    return (
      <Box
        sx={{
          overflow: 'hidden',
          pl: 3.5,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {isEditing ? (
          <TextField
            autoFocus={true}
            onBlur={onBlur}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            size="small"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: 'inherit',
              },
              width: '100%',
            }}
            value={editedValue}
          />
        ) : (
          <Tooltip arrow={true} title={task.title}>
            <Box
              onClick={handleClick}
              sx={{
                '&:hover': disabled
                  ? {}
                  : {
                      '& .edit-icon': {
                        opacity: 1,
                      },
                      textDecoration: 'underline',
                    },
                alignItems: 'center',
                cursor: disabled ? 'default' : 'pointer',
                display: 'flex',
                gap: 0.5,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Typography
                sx={{
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                variant="caption"
              >
                {task.title}
              </Typography>
              <EditOutlined
                className="edit-icon"
                sx={{
                  flexShrink: 0,
                  fontSize: 16,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
              />
            </Box>
          </Tooltip>
        )}
      </Box>
    )
  },
)

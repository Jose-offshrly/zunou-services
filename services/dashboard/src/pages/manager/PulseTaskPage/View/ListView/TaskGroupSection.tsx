import { ExpandLess, ExpandMore } from '@mui/icons-material'
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'

interface TaskGroupSectionProps {
  groupLabel: string
  groupColor?: string
  taskCount: number
  defaultExpanded?: boolean
  children: React.ReactNode
}

export const TaskGroupSection = ({
  groupLabel,
  groupColor,
  taskCount,
  defaultExpanded = true,
  children,
}: TaskGroupSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <Stack spacing={1}>
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          '&:hover': {
            backgroundColor: 'grey.50',
          },
          borderRadius: 1,
          cursor: 'pointer',
          px: 2,
          py: 1,
        }}
      >
        <Stack alignItems="center" direction="row" spacing={1.5}>
          {groupColor && (
            <Box
              sx={{
                backgroundColor: groupColor,
                borderRadius: '50%',
                height: 12,
                width: 12,
              }}
            />
          )}
          <Typography fontWeight="600" variant="body1">
            {groupLabel}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            ({taskCount})
          </Typography>
        </Stack>
        <IconButton size="small">
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Stack>

      <Collapse in={isExpanded}>
        <Stack
          bgcolor={(theme) => theme.palette.background.paper}
          border={1}
          borderColor="divider"
          borderRadius={2}
          divider={<Divider />}
          px={2}
        >
          {children}
        </Stack>
      </Collapse>
    </Stack>
  )
}

import { KeyboardArrowDown } from '@mui/icons-material'
import { IconButton, Stack, Typography } from '@mui/material'

interface SectionHeaderProps {
  title: string
  expanded: boolean
  onClick: () => void
  onAdd?: () => void
}

export const SectionHeader = ({
  title,
  expanded,
  onClick,
}: SectionHeaderProps) => {
  return (
    <Stack alignItems="center" direction="row" justifyContent="space-between">
      <Stack
        alignItems="center"
        direction="row"
        gap={1}
        justifyContent="space-between"
        width="100%"
      >
        <Typography
          sx={{
            color: 'grey.400',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>
      </Stack>
      <IconButton
        onClick={onClick}
        size="small"
        sx={{
          cursor: 'pointer',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <KeyboardArrowDown fontSize="small" />
      </IconButton>
    </Stack>
  )
}

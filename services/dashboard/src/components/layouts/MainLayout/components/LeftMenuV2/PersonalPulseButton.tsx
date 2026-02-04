import { Stack, Tooltip, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'

interface Props {
  onClick: () => void
  icon?: React.ReactNode
  title: string
  disabled?: boolean
  selected?: boolean
  collapsed?: boolean
  className?: string
}

export default function PersonalPulseButton({
  onClick,
  icon,
  title,
  disabled,
  selected = false,
  collapsed = false,
  className,
}: Props) {
  const button = (
    <Button
      disabled={disabled}
      onClick={onClick}
      sx={{
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        bgcolor: selected ? 'action.hover' : undefined,
        color: 'text.primary',
        py: 1,
        width: '100%',
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        gap={2}
        justifyContent={collapsed ? 'center' : undefined}
        width="100%"
      >
        {icon}
        {!collapsed && (
          <Typography
            className={className}
            color={
              disabled
                ? 'text.secondary'
                : selected
                  ? 'primary.main'
                  : 'text.primary'
            }
            variant="body2"
          >
            {title}
          </Typography>
        )}
      </Stack>
    </Button>
  )

  return (
    <Tooltip disableInteractive={true} placement="right" title={title}>
      {disabled ? <span style={{ width: '100%' }}>{button}</span> : button}
    </Tooltip>
  )
}

import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { IconButton } from '@zunou-react/components/form'

interface Props {
  direction: 'left' | 'right'
  onClick: () => void
  disabled: boolean
}

export const ScrollArrow = ({ disabled, direction, onClick }: Props) => (
  <IconButton
    disabled={disabled}
    onClick={onClick}
    size="small"
    sx={{
      border: '1px solid',
      flexShrink: 0,
      ml: direction === 'right' ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out',
    }}
  >
    {direction === 'left' ? <ChevronLeft /> : <ChevronRight />}
  </IconButton>
)

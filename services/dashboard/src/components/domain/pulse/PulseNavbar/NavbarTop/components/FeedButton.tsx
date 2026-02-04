import { ViewDayOutlined } from '@mui/icons-material'

import { NavButton } from '../../NavButton'

interface FeedButtonProps {
  onClick: () => void
}

export default function FeedButton({ onClick }: FeedButtonProps) {
  return (
    <>
      <NavButton
        label={'Feed'}
        onClick={onClick}
        startIcon={<ViewDayOutlined />}
      />
    </>
  )
}

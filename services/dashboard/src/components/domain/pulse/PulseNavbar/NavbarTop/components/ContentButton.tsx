import { DescriptionOutlined } from '@mui/icons-material'

import { NavButton } from '../../NavButton'

interface ContentButtonProps {
  onClick?: () => void
}

export default function ContentButton({ onClick }: ContentButtonProps) {
  return (
    <>
      <NavButton
        label={'Content'}
        onClick={onClick}
        startIcon={<DescriptionOutlined />}
      />
    </>
  )
}

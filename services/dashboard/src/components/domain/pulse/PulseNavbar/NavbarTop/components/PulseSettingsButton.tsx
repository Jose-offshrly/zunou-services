import { SettingsOutlined } from '@mui/icons-material'

import { NavButton } from '../../NavButton'

interface PulseSettingsButtonProps {
  handleOpenSetup: () => void
}

export default function PulseSettingsButton({
  handleOpenSetup,
}: PulseSettingsButtonProps) {
  return (
    <>
      <NavButton
        label=""
        onClick={handleOpenSetup}
        startIcon={<SettingsOutlined />}
      />
    </>
  )
}

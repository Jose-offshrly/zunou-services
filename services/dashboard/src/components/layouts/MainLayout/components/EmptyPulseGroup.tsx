import { Add } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { pathFor } from '@zunou-react/services/Routes'
import { useNavigate } from 'react-router-dom'

import { PrimaryGhostButton } from '~/components/ui/button/PrimaryGhostButton'
import { useOrganization } from '~/hooks/useOrganization'

interface EmptyPulseGroupProps {
  navigatePath: string
  buttonText: string
  isInverted: boolean
}

const EmptyPulseGroup = ({
  navigatePath,
  buttonText,
  isInverted,
}: EmptyPulseGroupProps) => {
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  return (
    <Stack
      alignItems="center"
      gap={1}
      justifyContent="center"
      sx={{ width: '100%' }}
    >
      <PrimaryGhostButton
        onClick={() =>
          navigate(
            pathFor({
              pathname: navigatePath,
              query: { organizationId },
            }),
          )
        }
        sx={{ borderRadius: '0' }}
      >
        <Add fontSize="small" />
      </PrimaryGhostButton>
      <Typography
        color={isInverted ? 'common.white' : 'text.primary'}
        fontSize={12}
        fontWeight={500}
        textAlign="center"
      >
        {buttonText}
      </Typography>
    </Stack>
  )
}
export default EmptyPulseGroup

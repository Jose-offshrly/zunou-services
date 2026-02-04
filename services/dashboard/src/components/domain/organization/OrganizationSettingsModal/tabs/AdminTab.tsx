import { Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useNavigate, useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

interface Props {
  handleClose: () => void
}

export default function AdminTab({ handleClose }: Props) {
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()

  const navigate = useNavigate()

  const { userRole } = useAuthContext()
  const rolePrefix = userRole && userRole.toLowerCase()

  const handleCompanionStatus = () => {
    navigate(
      pathFor({
        pathname: `/${rolePrefix}/${Routes.CompanionStatus}`,
        query: {
          organizationId,
          pulseId,
        },
      }),
    )

    handleClose()
  }

  return (
    <Stack spacing={2}>
      <Stack>
        <Typography fontWeight="bold" variant="h6">
          Admin
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Administrative tools and developer-exclusive functions for managing
          and maintaining the system.
        </Typography>
      </Stack>

      <Stack
        alignItems="center"
        borderBottom={1}
        borderColor="divider"
        flexDirection="row"
        gap={1}
        justifyContent="space-between"
        py={1}
      >
        <Typography variant="body2">Pulse Companion</Typography>
        <Button
          onClick={() => handleCompanionStatus()}
          sx={{
            width: 'fit-content',
          }}
          variant="contained"
        >
          Status
        </Button>
      </Stack>
    </Stack>
  )
}

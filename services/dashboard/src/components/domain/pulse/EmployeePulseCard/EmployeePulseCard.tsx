import {
  alpha,
  Card,
  CardContent,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material'
import { Pulse } from '@zunou-graphql/core/graphql'
import { pathFor } from '@zunou-react/services/Routes'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { getPulseIcon } from '~/utils/getPulseIcon'

interface EmployeePulseCardProps {
  pulse: Pulse
  notificationCount: string
}

const EmployeePulseCard = ({
  pulse,
  notificationCount,
}: EmployeePulseCardProps) => {
  const navigate = useNavigate()
  const { organizationId } = useOrganization()

  const onSelectPulse = () => {
    navigate(
      pathFor({
        pathname: `/employee/${Routes.PulseDetail}`,
        query: {
          organizationId,
          pulseId: pulse.id,
        },
      }),
    )
  }
  return (
    <Card
      onClick={onSelectPulse}
      sx={{
        '&:hover': {
          boxShadow: 'none',
        },
        bgcolor: 'transparent',
        borderRadius: 2,
        cursor: 'pointer',
        flex: 1,
        height: '100%',
        minWidth: 240,
      }}
      variant="outlined"
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: '100%',
        }}
      >
        <Stack spacing={2}>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
          >
            <Stack
              alignItems="center"
              bgcolor={(theme) => theme.palette.primary.main}
              borderRadius="50%"
              height={40}
              justifyContent="center"
              width={40}
            >
              <SvgIcon
                component={getPulseIcon(pulse.icon)}
                fontSize="inherit"
                sx={{ color: 'white', fontSize: 20 }}
              />
            </Stack>
            {notificationCount ? (
              <Stack
                alignItems="center"
                bgcolor="secondary.main"
                borderRadius="50%"
                color="common.white"
                fontSize={14}
                fontWeight="bold"
                height={24}
                justifyContent="center"
                width={24}
              >
                {notificationCount}
              </Stack>
            ) : null}
          </Stack>
          <Typography color="text.primary" fontSize={20} fontWeight="medium">
            {pulse.name}
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            {pulse.description}
          </Typography>
          <Stack
            bgcolor={(theme) => alpha(theme.palette.secondary.main, 0.01)}
            borderRadius={1}
            p={2}
          ></Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default EmployeePulseCard

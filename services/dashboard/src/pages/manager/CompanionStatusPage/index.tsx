import { KeyboardBackspaceOutlined } from '@mui/icons-material'
import { Divider, Stack } from '@mui/material'
import { useGetCompanionStatus } from '@zunou-queries/core/hooks/useGetCompanionStatus'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

import CompanionContainer from './components/CompanionContainer'
import MeetingContainer from './components/MeetingsContainer'
import { SchedulerStatusDashboard } from './components/SchedulerStatusDashboard'

type ActiveState = 'COMPANION' | 'MEETING'

export default function CompanionStatusPage() {
  const navigate = useNavigate()

  const [active, setActive] = useState<ActiveState>('COMPANION')

  const { pulseId } = useParams()
  const { organizationId } = useOrganization()

  const { userRole } = useAuthContext()
  const rolePrefix = userRole && userRole.toLowerCase()

  const {
    data: companionStatusData,
    isRefetching: isCompanionStatusRefetching,
    isLoading: isCompanionStatusLoading,
    refetch: refetchCompanionStatus,
  } = useGetCompanionStatus({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!pulseId && !!organizationId,
    variables: {
      organizationId,
    },
  })

  const handleBack = () => {
    navigate(
      pathFor({
        pathname: `/${rolePrefix}/${Routes.PulseTeamChat}`,
        query: {
          organizationId,
          pulseId,
        },
      }),
    )
  }

  return (
    <Stack height="100%" p={7} spacing={2} width="100%">
      <Stack flexDirection="row" justifyContent="start">
        <Button onClick={handleBack} startIcon={<KeyboardBackspaceOutlined />}>
          Back
        </Button>
      </Stack>
      {/* Scheduler Status Dashboard */}
      <SchedulerStatusDashboard
        isLoading={isCompanionStatusLoading || isCompanionStatusRefetching}
        onRefetch={refetchCompanionStatus}
      />

      {/* Companion Status */}
      <Stack
        bgcolor="common.white"
        border={1}
        borderColor="divider"
        borderRadius={2}
        display={active === 'MEETING' ? 'none' : undefined}
        divider={<Divider />}
        flex={1}
        gap={2}
        height={0}
        p={2}
      >
        <CompanionContainer
          isLoading={isCompanionStatusLoading || isCompanionStatusRefetching}
          meetings={companionStatusData?.companionStatus ?? []}
          setActive={(active: ActiveState) => setActive(active)}
        />
      </Stack>

      {/* Event Status */}
      <Stack
        bgcolor="common.white"
        border={1}
        borderColor="divider"
        borderRadius={2}
        display={active === 'COMPANION' ? 'none' : undefined}
        divider={<Divider />}
        flex={1}
        gap={2}
        height={0}
        p={2}
      >
        <MeetingContainer
          isLoading={isCompanionStatusLoading || isCompanionStatusRefetching}
          meetings={companionStatusData?.companionStatus ?? []}
          setActive={(active: ActiveState) => setActive(active)}
        />
      </Stack>
    </Stack>
  )
}

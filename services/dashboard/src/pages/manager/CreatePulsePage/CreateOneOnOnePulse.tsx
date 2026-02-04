import { withAuthenticationRequired } from '@auth0/auth0-react'
import { DeleteOutlined, PeopleOutline } from '@mui/icons-material'
import { Grid, Stack, Typography } from '@mui/material'
import { Box } from '@mui/system'
import {
  PulseGuestRole,
  Strategy,
  StrategyType,
} from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PulseAddStrategyModal } from '~/components/domain/pulse/PulseAddStrategyModal'

import { MissionCard } from './cards'
import { LoadingOverlay, MemberSelection } from './components'
import { useHooks } from './hooks'

const CreateOneOnOnePulse = () => {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(
    null,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [strategyType, setStrategyType] = useState<StrategyType | null>(null)

  const {
    missions,
    handleFormSubmit,
    handleMembersChange,
    setMissions,
    selectedMemberId,
    setSelectedMemberId,
    setSelectedMemberRole,
    isLoading,
  } = useHooks('one-on-one')

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedStrategy(null)
    setIsEditing(false)
    setStrategyType(null)
  }

  const handleAddMission = () => {
    setStrategyType(StrategyType.Missions)
    setIsModalOpen(true)
  }

  const handleEditMission = (mission: Strategy) => {
    setSelectedStrategy(mission)
    setStrategyType(StrategyType.Missions)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDelete = () => {
    if (!selectedStrategy) return

    const missionIndex = missions.findIndex((m) => m.id === selectedStrategy.id)
    if (missionIndex !== -1) {
      const newMissions = [...missions]
      newMissions.splice(missionIndex, 1)
      setMissions(newMissions)
    }
    handleClose()
  }

  const onSubmit = (data: { name: string; description: string }) => {
    if (!strategyType) return

    const newStrategy: Strategy = {
      createdAt: selectedStrategy?.createdAt ?? new Date().toISOString(),
      description: data.description,
      id: selectedStrategy?.id ?? `temp-${Date.now()}`,
      name: data.name,
      organizationId: '',
      pulseId: '',
      type: strategyType,
      updatedAt: new Date().toISOString(),
    }

    if (selectedStrategy) {
      const missionIndex = missions.findIndex(
        (m) => m.id === selectedStrategy.id,
      )
      if (missionIndex !== -1) {
        const newMissions = [...missions]
        newMissions[missionIndex] = newStrategy
        setMissions(newMissions)
      }
    } else {
      setMissions([...missions, newStrategy])
    }
    handleClose()
  }

  return (
    <Stack
      alignSelf="center"
      justifySelf="center"
      maxWidth="xl"
      p={4}
      spacing={2}
      width="100%"
    >
      {isLoading && <LoadingOverlay />}
      <Stack direction="column" justifyContent="space-between" spacing={4}>
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack alignItems="flex-start" spacing={2}>
            <Typography fontWeight="medium" textAlign="center" variant="h4">
              <Box
                component="span"
                sx={{
                  textDecoration: 'underline',
                  textDecorationColor: theme.palette.secondary.main,
                  textUnderlineOffset: 20,
                }}
              >
                Create
              </Box>{' '}
              a pulse
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              onClick={() => navigate(-1)}
              size="medium"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              disabled={isLoading || !selectedMemberId}
              onClick={handleFormSubmit}
              size="medium"
              variant="contained"
            >
              Make
            </Button>
          </Stack>
        </Stack>

        <Stack padding={2} spacing={1}>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="flex-start"
            spacing={2}
          >
            <PeopleOutline
              sx={{
                alignItems: 'center',
                backgroundColor: theme.palette.secondary.main,
                borderRadius: '50%',
                color: 'white',
                height: '32px',
                p: 1,
                width: '32px',
              }}
            />

            <Typography color="text.secondary" fontWeight="medium" variant="h5">
              1 to 1 Pulse
            </Typography>
          </Stack>
          <Typography color="text.secondary" variant="body1">
            You&apos;ll need one more team member to start a pulse. Add someone
            to continue.
          </Typography>
        </Stack>
      </Stack>

      <Stack
        sx={{
          width: '100%',
        }}
      >
        <Grid container={true} justifyContent="center" spacing={3}>
          <Grid item={true} md={6} xs={12}>
            <MemberSelection
              isCustomPulse={false}
              onMembersChange={handleMembersChange}
              selectedMemberId={selectedMemberId}
              setSelectedMemberId={setSelectedMemberId}
              setSelectedMemberRole={
                setSelectedMemberRole as unknown as (
                  role: PulseGuestRole,
                ) => void
              }
            />
          </Grid>

          <Grid item={true} md={6} xs={12}>
            <MissionCard
              missions={missions}
              onAddClick={handleAddMission}
              onEditClick={handleEditMission}
            />
          </Grid>
        </Grid>
      </Stack>

      {strategyType && (
        <PulseAddStrategyModal
          draftDescription={selectedStrategy?.description ?? undefined}
          draftTitle={selectedStrategy?.name ?? undefined}
          headerActions={
            isEditing
              ? [
                  {
                    icon: DeleteOutlined,
                    onClick: handleDelete,
                  },
                ]
              : undefined
          }
          isConfirmation={false}
          isOpen={isModalOpen}
          onClose={handleClose}
          onSubmit={onSubmit}
          subheader="Define the objective behind this pulse to give your workflow clear direction."
          title={isEditing ? 'Edit Mission' : 'Add Mission'}
          type={strategyType}
        />
      )}
    </Stack>
  )
}

export default withAuthenticationRequired(CreateOneOnOnePulse, {
  onRedirecting: () => <div>Signing in...</div>,
})

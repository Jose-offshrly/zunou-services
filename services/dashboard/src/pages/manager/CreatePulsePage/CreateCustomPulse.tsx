import { withAuthenticationRequired } from '@auth0/auth0-react'
import { DeleteOutlined } from '@mui/icons-material'
import { Grid, Stack } from '@mui/material'
import { Strategy, StrategyType } from '@zunou-graphql/core/graphql'
import { useState } from 'react'

import { PulseAddStrategyModal } from '~/components/domain/pulse/PulseAddStrategyModal'
import { useOrganization } from '~/hooks/useOrganization'

import { AutomationsCard, DataCard, MissionCard } from './cards'
import { LoadingOverlay, MemberSelection, PageHeader } from './components'
import { useHooks } from './hooks'

const CreateCustomPulse = () => {
  const { organizationId } = useOrganization()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(
    null,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [strategyType, setStrategyType] = useState<StrategyType | null>(null)

  const {
    companyName,
    missions,
    automations,
    dataSources,
    isLoading,
    register,
    handleFormSubmit,
    handleMembersChange,
    handleUploadData,
    handleRemoveDataSource,
    setMissions,
    setAutomations,
    selectedIcon,
    handleIconSelect,
    isValid,
  } = useHooks()

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

  const handleAddAutomation = () => {
    setStrategyType(StrategyType.Automations)
    setIsModalOpen(true)
  }

  const handleEditMission = (mission: Strategy) => {
    setSelectedStrategy(mission)
    setStrategyType(StrategyType.Missions)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleEditAutomation = (automation: Strategy) => {
    setSelectedStrategy(automation)
    setStrategyType(StrategyType.Automations)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDelete = () => {
    if (!selectedStrategy) return

    if (selectedStrategy.type === StrategyType.Missions) {
      const missionIndex = missions.findIndex(
        (m) => m.id === selectedStrategy.id,
      )
      if (missionIndex !== -1) {
        const newMissions = [...missions]
        newMissions.splice(missionIndex, 1)
        setMissions(newMissions)
      }
    } else {
      const automationIndex = automations.findIndex(
        (a) => a.id === selectedStrategy.id,
      )
      if (automationIndex !== -1) {
        const newAutomations = [...automations]
        newAutomations.splice(automationIndex, 1)
        setAutomations(newAutomations)
      }
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
      organizationId,
      pulseId: '',
      type: strategyType,
      updatedAt: new Date().toISOString(),
    }

    if (selectedStrategy) {
      if (strategyType === StrategyType.Missions) {
        const missionIndex = missions.findIndex(
          (m) => m.id === selectedStrategy.id,
        )
        if (missionIndex !== -1) {
          const newMissions = [...missions]
          newMissions[missionIndex] = newStrategy
          setMissions(newMissions)
        }
      } else {
        const automationIndex = automations.findIndex(
          (a) => a.id === selectedStrategy.id,
        )
        if (automationIndex !== -1) {
          const newAutomations = [...automations]
          newAutomations[automationIndex] = newStrategy
          setAutomations(newAutomations)
        }
      }
    } else {
      if (strategyType === StrategyType.Missions) {
        setMissions([...missions, newStrategy])
      } else {
        setAutomations([...automations, newStrategy])
      }
    }
    handleClose()
  }

  return (
    <Stack
      alignSelf="center"
      justifySelf="center"
      maxWidth="xl"
      spacing={2}
      sx={{ p: 4 }}
      width="100%"
    >
      {isLoading && <LoadingOverlay />}
      <PageHeader
        companyName={companyName ?? ''}
        isDisabled={isLoading || !companyName}
        isValid={isValid}
        onIconSelect={handleIconSelect}
        onSubmit={handleFormSubmit}
        register={register}
        selectedIcon={selectedIcon}
      />

      <Stack
        sx={{
          width: '100%',
        }}
      >
        <Grid container={true} justifyContent="center" spacing={3}>
          <Grid item={true} md={6} xs={12}>
            <MissionCard
              missions={missions}
              onAddClick={handleAddMission}
              onEditClick={handleEditMission}
            />
          </Grid>

          <Grid item={true} md={6} xs={12}>
            <AutomationsCard
              automations={automations}
              onAddClick={handleAddAutomation}
              onEditClick={handleEditAutomation}
            />
          </Grid>

          <Grid item={true} md={6} xs={12}>
            <MemberSelection
              isCustomPulse={true}
              onMembersChange={handleMembersChange}
            />
          </Grid>

          <Grid item={true} md={6} xs={12}>
            <DataCard
              dataSources={dataSources}
              onRemoveDataSource={handleRemoveDataSource}
              onUploadData={handleUploadData}
              organizationId={organizationId}
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
          subheader={
            strategyType === StrategyType.Missions
              ? 'Define the objective behind this pulse to give your workflow clear direction.'
              : 'Define the automation to streamline your workflow.'
          }
          title={
            isEditing
              ? `Edit ${strategyType === StrategyType.Missions ? 'Mission' : 'Automation'}`
              : `Add ${strategyType === StrategyType.Missions ? 'Mission' : 'Automation'}`
          }
          type={strategyType}
        />
      )}
    </Stack>
  )
}

export default withAuthenticationRequired(CreateCustomPulse, {
  onRedirecting: () => <div>Signing in...</div>,
})

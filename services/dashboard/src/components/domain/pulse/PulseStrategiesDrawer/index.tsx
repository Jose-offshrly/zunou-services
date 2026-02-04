import {
  Add,
  AvTimer,
  Close,
  FlagOutlined,
  SmartToyOutlined,
  TopicOutlined,
} from '@mui/icons-material'
import {
  alpha,
  Box,
  Divider,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  Theme,
  Typography,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import type { GroupedStrategies, Strategy } from '@zunou-graphql/core/graphql'
import { StrategyType } from '@zunou-graphql/core/graphql'
import { useCreateStrategyMutation } from '@zunou-queries/core/hooks/useCreateStrategyMutation'
import { useDeleteStrategyMutation } from '@zunou-queries/core/hooks/useDeleteStrategyMutation'
import { useGetAutomationLogQuery } from '@zunou-queries/core/hooks/useGetAutomationLogQuery'
import { useUpdateStrategyMutation } from '@zunou-queries/core/hooks/useUpdateStrategyMutation'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import { EmptyState } from 'zunou-react/components/layout/EmptyState'

import { PulseStrategiesCard } from '~/components/domain/pulse/PulseStrategiesCard'
import { PrimaryGhostButton } from '~/components/ui/button/PrimaryGhostButton'
import { CustomModal } from '~/components/ui/CustomModal'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { StrategyFormData } from '~/schemas/StrategiesSchema'

import { PulseAddStrategyModal } from '../PulseAddStrategyModal'

interface StrategySectionProps {
  icon: React.ReactNode
  isDisabled?: boolean
  message: string
  onAddStrategy: (type: StrategyType) => void
  onEditStrategy: (strategy: Strategy) => void
  onLogsClick?: (strategy: Strategy) => void
  strategies?: Strategy[]
  title: string
  type: StrategyType
}

const StrategyTypeMap = {
  [StrategyType.Kpis]: 'KPI',
  [StrategyType.Alerts]: 'Alert',
  [StrategyType.Automations]: 'Automation',
  [StrategyType.Missions]: 'Mission',
}

const StrategySection = ({
  icon,
  isDisabled = false,
  message,
  onAddStrategy,
  onEditStrategy,
  onLogsClick,
  strategies,
  title,
  type,
}: StrategySectionProps) => {
  return (
    <Stack spacing={2}>
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Stack alignItems="center" direction="row" spacing={1}>
          <Typography fontWeight="bold" variant="subtitle1">
            {title}
          </Typography>
          {isDisabled && (
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="center"
              spacing={1}
            >
              <Divider
                flexItem={true}
                orientation="vertical"
                sx={{
                  backgroundColor: theme.palette.secondary.main,
                  height: 16,
                }}
              />

              <Typography color={theme.palette.secondary.main} fontSize="12px">
                Coming soon
              </Typography>
            </Stack>
          )}
        </Stack>
        <PrimaryGhostButton
          disabled={isDisabled}
          onClick={() => onAddStrategy(type)}
        >
          <Add fontSize="small" />
        </PrimaryGhostButton>
      </Stack>
      {strategies && strategies.length > 0
        ? strategies.map((strategy) => (
            <PulseStrategiesCard
              description={strategy.description ?? ''}
              isAutomations={type === StrategyType.Automations}
              isLogsClick={() => onLogsClick?.(strategy)}
              key={strategy.id}
              onEdit={() => onEditStrategy(strategy)}
              title={strategy.name}
              type={type}
            />
          ))
        : !isDisabled && (
            <EmptyState
              icon={icon}
              isDisabled={isDisabled}
              message={message}
              onClick={() => onAddStrategy(type)}
            />
          )}
    </Stack>
  )
}

interface PulseStrategiesDrawerProps {
  open: boolean
  onClose: () => void
  strategies: GroupedStrategies
}

export const PulseStrategiesDrawer = ({
  open,
  onClose,
  strategies,
}: PulseStrategiesDrawerProps) => {
  const [selectedStrategyType, setSelectedStrategyType] =
    useState<StrategyType | null>(null)
  const [isAddStrategyModalOpen, setIsAddStrategyModalOpen] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null)
  const [isLogsOpen, setIsLogsOpen] = useState(false)
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()
  const queryClient = useQueryClient()

  const handleStrategiesUpdated = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['strategies', pulseId],
    })
  }, [queryClient, pulseId])

  usePusherChannel({
    channelName: `strategies.${organizationId}.pulse.${pulseId}`,
    eventName: '.strategies-updated',
    onEvent: handleStrategiesUpdated,
  })

  const { mutate: updateStrategy, isPending: isUpdating } =
    useUpdateStrategyMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutate: createStrategy, isPending: isCreating } =
    useCreateStrategyMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutate: deleteStrategy, isPending: isDeleting } =
    useDeleteStrategyMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleAddStrategy = (type: StrategyType) => {
    setSelectedStrategyType(type)
    setEditingStrategy(null)
    setIsAddStrategyModalOpen(true)
  }

  const handleEditStrategy = (strategy: Strategy) => {
    setSelectedStrategyType(strategy.type)
    setEditingStrategy(strategy)
    setIsAddStrategyModalOpen(true)
  }

  const handleDeleteStrategy = () => {
    if (!editingStrategy) return

    deleteStrategy(
      { strategyId: editingStrategy.id },
      {
        onError: (error) => {
          console.error('Error deleting strategy:', error)
        },
        onSuccess: () => {
          handleModalClose()
          toast.success('Successfully deleted strategy!')
        },
      },
    )
  }

  const handleModalClose = () => {
    setIsAddStrategyModalOpen(false)
    setSelectedStrategyType(null)
    setEditingStrategy(null)
  }

  const onSubmit = ({
    description,
    name,
    prompt_description,
  }: StrategyFormData) => {
    if (!pulseId) return

    if (editingStrategy) {
      updateStrategy(
        {
          description,
          id: editingStrategy.id,
          name,
        },
        {
          onError: (error) => {
            console.error('Error updating strategy:', error)
          },
          onSuccess: () => {
            handleModalClose()
            toast.success('Successfully edited strategy!')
          },
        },
      )
    } else {
      if (!selectedStrategyType) return

      createStrategy(
        {
          description,
          name,
          organizationId,
          prompt_description,
          pulseId,
          type: selectedStrategyType,
        },
        {
          onError: (error) => {
            console.error('Error creating strategy:', error)
          },
          onSuccess: () => {
            handleModalClose()
            toast.success('Successfully created strategy!')
          },
        },
      )
    }
  }

  const getTitle = () => {
    if (editingStrategy) {
      return `Edit ${StrategyTypeMap[editingStrategy.type]}`
    }

    switch (selectedStrategyType) {
      case StrategyType.Kpis:
        return 'Add KPI'
      case StrategyType.Alerts:
        return 'Add Alert'
      case StrategyType.Automations:
        return 'Add Automation'
      default:
        return 'Add Mission'
    }
  }

  const getSubheader = () => {
    switch (selectedStrategyType) {
      case StrategyType.Kpis:
        return 'Define a KPI to measure the success of your pulse.'
      case StrategyType.Alerts:
        return 'Set up an alert to notify you when certain conditions are met.'
      case StrategyType.Automations:
        return 'Set up a task that triggers under certain conditions for seamless workflow.'
      case StrategyType.Missions:
        return 'Define the goals and objectives of your pulse.'
    }
  }

  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    null,
  )

  const { data: automationLogs, isLoading: isLoadingLogs } =
    useGetAutomationLogQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!selectedStrategyId,
      variables: {
        strategyId: selectedStrategyId ?? '',
      },
    })

  // Helper to get color for log type
  const getLogColor = (level: string, theme: Theme, ifAlpha = true) => {
    switch (level.toUpperCase()) {
      case 'SUCCESS':
      case 'INFO':
        return ifAlpha
          ? alpha(theme.palette.success.main, 0.1)
          : theme.palette.success.main
      case 'ERROR':
        return ifAlpha
          ? alpha(theme.palette.secondary.main, 0.1)
          : theme.palette.secondary.main
      default:
        return ifAlpha
          ? alpha(theme.palette.primary.main, 0.1)
          : theme.palette.primary.main
    }
  }

  const handleLogsClick = (strategy: Strategy) => {
    setSelectedStrategyId(strategy.id)
    setIsLogsOpen(true)
    console.log('strategy', strategy)
  }

  return (
    <Drawer
      PaperProps={{
        sx: {
          width: 400,
        },
      }}
      anchor="right"
      onClose={onClose}
      open={open}
    >
      <Stack
        padding={3}
        spacing={3}
        sx={{
          '&::-webkit-scrollbar': { display: 'none' },
          height: '100%',
          msOverflowStyle: 'none',
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography fontWeight="bold" variant="h6">
            Strategy
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
        <Stack
          alignItems="flex-start"
          bgcolor={alpha(theme.palette.primary.main, 0.01)}
          border={`1px solid ${alpha(theme.palette.primary.main, 0.5)}`}
          borderRadius={2}
          direction="row"
          p={2}
          spacing={2}
        >
          <Stack
            bgcolor={theme.palette.primary.main}
            borderRadius="50%"
            color={theme.palette.primary.contrastText}
            p={1}
          >
            <SmartToyOutlined fontSize="medium" />
          </Stack>
          <Typography color={theme.palette.primary.main} fontSize="12">
            Stay informed with important updates, team activities, quick polls
            for feedback, and a central hub for essential resources.
          </Typography>
        </Stack>

        <StrategySection
          icon={<FlagOutlined fontSize="small" />}
          message="Add a mission to streamline your team's essential tasks and enhance productivity."
          onAddStrategy={handleAddStrategy}
          onEditStrategy={handleEditStrategy}
          strategies={strategies.missions ?? []}
          title="Missions"
          type={StrategyType.Missions}
        />
        <StrategySection
          icon={<AvTimer fontSize="small" />}
          message="Automations simplify tasks by acting automatically on triggers. Add one to boost your workflow!"
          onAddStrategy={handleAddStrategy}
          onEditStrategy={handleEditStrategy}
          onLogsClick={handleLogsClick}
          strategies={strategies.automations ?? []}
          title="Automations"
          type={StrategyType.Automations}
        />
        {/* <StrategySection
          icon={<FlagOutlined fontSize="small" />}
          isDisabled={true}
          message="Add a KPI to get started"
          onAddStrategy={handleAddStrategy}
          onEditStrategy={handleEditStrategy}
          strategies={strategies.kpis ?? []}
          title="KPIs"
          type={StrategyType.Kpis}
        />
        <StrategySection
          icon={<ErrorOutline fontSize="small" />}
          isDisabled={true}
          message="Add an alert to get started"
          onAddStrategy={handleAddStrategy}
          onEditStrategy={handleEditStrategy}
          strategies={strategies.alerts ?? []}
          title="Alerts"
          type={StrategyType.Alerts}
        /> */}
      </Stack>
      {selectedStrategyType && (
        <PulseAddStrategyModal
          draftDescription={editingStrategy?.description ?? undefined}
          draftTitle={editingStrategy?.name ?? undefined}
          isConfirmation={false}
          isOpen={isAddStrategyModalOpen}
          isSubmitting={isUpdating || isCreating || isDeleting}
          onClose={handleModalClose}
          onDelete={editingStrategy ? handleDeleteStrategy : undefined}
          onSubmit={onSubmit}
          subheader={getSubheader()}
          title={getTitle()}
          type={selectedStrategyType}
        />
      )}
      <CustomModal
        isOpen={isLogsOpen}
        onClose={() => {
          setIsLogsOpen(false)
          setSelectedStrategyId(null)
        }}
        title="Automations Logs"
      >
        {isLoadingLogs ? (
          <Stack spacing={2}>
            <Skeleton height={40} variant="text" width="100%" />
            <Skeleton height={40} variant="text" width="100%" />
            <Skeleton height={40} variant="text" width="100%" />
          </Stack>
        ) : automationLogs?.automationLog.length &&
          automationLogs?.automationLog.length > 0 ? (
          <Stack
            spacing={2}
            sx={{ maxHeight: 350, minWidth: 320, overflowY: 'auto' }}
          >
            {automationLogs?.automationLog.map((log) =>
              log.properties.logs.map((logEntry, idx) => (
                <Stack
                  alignItems="center"
                  direction="row"
                  key={`${log.id}-${idx}`}
                  sx={{ position: 'relative' }}
                >
                  <Box
                    sx={{
                      bgcolor: (theme) =>
                        getLogColor(logEntry.level, theme, false),
                      bottom: 0,
                      left: 0,
                      position: 'absolute',
                      top: 0,
                      width: 1.5,
                    }}
                  />
                  <Stack
                    sx={{
                      bgcolor: (theme) => getLogColor(logEntry.level, theme),
                      borderRadius: 2,
                      height: '100%',
                      minWidth: 4,
                      width: 4,
                    }}
                  />
                  <Stack
                    alignItems="center"
                    direction="row"
                    spacing={1}
                    sx={{ ml: 1 }}
                  >
                    <Stack
                      bgcolor={getLogColor(logEntry.level, theme)}
                      borderRadius={1}
                      px={2}
                      py={0.5}
                    >
                      <Typography
                        color={getLogColor(logEntry.level, theme, false)}
                        fontWeight="bold"
                        variant="caption"
                      >
                        {logEntry.level}
                      </Typography>
                    </Stack>
                    <Typography
                      color={theme.palette.text.secondary}
                      fontSize="12"
                    >
                      [{new Date(log.properties.runAt).toLocaleString()}]
                      <span
                        style={{
                          color: theme.palette.text.primary,
                          marginLeft: 4,
                        }}
                      >
                        {logEntry.message}
                      </span>
                      <span
                        style={{
                          color: theme.palette.text.secondary,
                          marginLeft: 4,
                        }}
                      >
                        {logEntry.context}
                      </span>
                    </Typography>
                  </Stack>
                </Stack>
              )),
            )}
          </Stack>
        ) : (
          <Stack
            alignItems="center"
            height="100%"
            justifyContent="center"
            spacing={2}
            width="100%"
          >
            <TopicOutlined fontSize="large" />
            <Typography variant="body1">
              No logs found for this automation
            </Typography>
          </Stack>
        )}
      </CustomModal>
    </Drawer>
  )
}

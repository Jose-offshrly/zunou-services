import type { Strategy } from '@zunou-graphql/core/graphql'
import { StrategyType } from '@zunou-graphql/core/graphql'
import { useCreateStrategyMutation } from '@zunou-queries/core/hooks/useCreateStrategyMutation'
import { useUpdateStrategyMutation } from '@zunou-queries/core/hooks/useUpdateStrategyMutation'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { zodResolver } from '~/libs/zod'
import {
  StrategyFormData,
  strategyFormSchema,
} from '~/schemas/StrategiesSchema'

import { PulseAddStrategyModal } from '../../pulse/PulseAddStrategyModal'
import { MessageStrategyItem } from '../MessageStrategyItem/MessageStrategyItem'

interface StrategyModalSectionProps {
  title: string
  description: string
  strategy: StrategyType
  isSubmitting: boolean
  prompt_description: string
  isSuccess: boolean
  isStrategyModalOpen: boolean
  setIsStrategyModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  onSubmit: (data: StrategyFormData) => void
}

const STRATEGY_TITLES: Record<StrategyType, string> = {
  [StrategyType.Kpis]: 'Add KPI',
  [StrategyType.Alerts]: 'Add Alert',
  [StrategyType.Automations]: 'Add Automation',
  [StrategyType.Missions]: 'Add Mission',
}

const STRATEGY_DESCRIPTIONS: Record<StrategyType, string> = {
  [StrategyType.Kpis]: 'Define a KPI to measure the success of your pulse.',
  [StrategyType.Alerts]:
    'Set up an alert to notify you when certain conditions are met.',
  [StrategyType.Automations]:
    'Set up a task that triggers under certain conditions for seamless workflow.',
  [StrategyType.Missions]: 'Define the goals and objectives of your pulse.',
}

export const StrategyModalSection = ({
  title,
  description,
  prompt_description,
  isSuccess,
  strategy,
  isSubmitting,
  isStrategyModalOpen,
  setIsStrategyModalOpen,
  onSubmit,
}: StrategyModalSectionProps) => (
  <>
    <MessageStrategyItem
      onClick={() => setIsStrategyModalOpen(true)}
      title={title}
      type={strategy}
    />
    <PulseAddStrategyModal
      draftDescription={description}
      draftTitle={title}
      isConfirmation={true}
      isOpen={isStrategyModalOpen}
      isSubmitting={isSubmitting}
      isSuccess={isSuccess}
      onClose={() => setIsStrategyModalOpen(false)}
      onSubmit={onSubmit}
      prompt_description={prompt_description}
      subheader={STRATEGY_DESCRIPTIONS[strategy]}
      title={STRATEGY_TITLES[strategy]}
      type={strategy}
    />
  </>
)

interface useStrategyManagementProps {
  strategy: StrategyType | null
  setIsStrategyModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const useStrategyManagement = ({
  strategy,
  setIsStrategyModalOpen,
}: useStrategyManagementProps) => {
  const [selectedStrategyType, setSelectedStrategyType] =
    useState<StrategyType | null>(strategy)
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null)

  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const { reset } = useForm<StrategyFormData>({
    mode: 'onBlur',
    resolver: zodResolver(strategyFormSchema),
  })

  const { mutate: updateStrategy, isPending: isUpdating } =
    useUpdateStrategyMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutate: createStrategy, isPending: isCreating } =
    useCreateStrategyMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleModalClose = useCallback(() => {
    setIsStrategyModalOpen(false)
    setSelectedStrategyType(null)
    setEditingStrategy(null)
    reset({ description: '', name: '' })
  }, [reset, setIsStrategyModalOpen])

  const onSubmit = useCallback(
    (data: StrategyFormData) => {
      if (!pulseId) return

      const { description, name, prompt_description } = data

      if (editingStrategy) {
        updateStrategy(
          { description, id: editingStrategy.id, name },
          {
            onError: (error) =>
              console.error('Error updating strategy:', error),
            onSuccess: () => {
              handleModalClose()
              reset()
              toast.success('Successfully edited strategy!')
            },
          },
        )
      } else if (selectedStrategyType) {
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
            onError: (error) =>
              console.error('Error creating strategy:', error),
            onSuccess: () => {
              handleModalClose()
              reset()
              toast.success('Successfully created strategy!')
            },
          },
        )
      }
    },
    [
      pulseId,
      editingStrategy,
      selectedStrategyType,
      organizationId,
      updateStrategy,
      createStrategy,
      handleModalClose,
      reset,
    ],
  )

  return {
    editingStrategy,
    isSubmitting: isUpdating || isCreating,
    onSubmit,
    selectedStrategyType,
    setEditingStrategy,
    setSelectedStrategyType,
  }
}

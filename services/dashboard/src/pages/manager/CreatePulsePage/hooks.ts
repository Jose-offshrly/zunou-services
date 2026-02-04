import { zodResolver } from '@hookform/resolvers/zod'
import {
  DataSourceType,
  ProvisionPulseInput,
  PulseMember,
  PulseMemberRole,
  PulseType,
  Strategy,
  StrategyType,
} from '@zunou-graphql/core/graphql'
import { useCreatePulseMutation } from '@zunou-queries/core/hooks/useCreatePulseMutation'
import { pathFor } from '@zunou-react/services/Routes'
import { useState } from 'react'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { createPulseSchema } from '~/schemas/CreatePulseSchema'
import { Routes } from '~/services/Routes'

import { DataSource, PulseFormData } from './types'

export const useHooks = (pulseType: 'one-on-one' | 'custom' = 'custom') => {
  const { organizationId } = useOrganization()
  const navigate = useNavigate()
  const [isMissionEditing, setIsMissionEditing] = useState(false)
  const [isProcessingDataSources, setIsProcessingDataSources] = useState(false)

  const { mutateAsync: createPulse, isPending: isCreatingPulse } =
    useCreatePulseMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  // Combine loading states
  const isLoading = isCreatingPulse || isProcessingDataSources

  const [selectedIcon, setSelectedIcon] = useState<PulseType>(PulseType.Account)
  const handleIconSelect = (value: PulseType) => {
    setSelectedIcon(value)
  }
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PulseFormData>({
    defaultValues: {
      automations: [],
      companyName: pulseType === 'one-on-one' ? 'One-to-One' : undefined,
    },
    resolver: zodResolver(createPulseSchema),
  })

  const companyName = useWatch({ control, name: 'companyName' })
  const missionText = useWatch({ control, name: 'missionText' })

  const isValid = !errors.companyName

  const defaultMissions: Strategy[] =
    pulseType === 'one-on-one'
      ? [
          {
            createdAt: new Date().toISOString(),
            description:
              'Act as a trusted AI partner for 1-2-1 communication and alignment, focused on driving clarity, follow-through, and meaningful progress between two individuals.',
            id: 'temp-1',
            name: 'AI Partner',
            organizationId,
            pulseId: '',
            type: StrategyType.Missions,
            updatedAt: new Date().toISOString(),
          },
          {
            createdAt: new Date().toISOString(),
            description:
              'Surface relevant context from meetings, notes, and ongoing work to propose personalized agendas, flag misalignments, and ensure shared understanding.',
            id: 'temp-2',
            name: 'Context Surface',
            organizationId,
            pulseId: '',
            type: StrategyType.Missions,
            updatedAt: new Date().toISOString(),
          },
          {
            createdAt: new Date().toISOString(),
            description:
              'Automatically convert key discussion points into structured Tasks within the system, assign ownership, set deadlines, and track completion over time.',
            id: 'temp-3',
            name: 'Task Conversion',
            organizationId,
            pulseId: '',
            type: StrategyType.Missions,
            updatedAt: new Date().toISOString(),
          },
          {
            createdAt: new Date().toISOString(),
            description:
              'Proactively follow up on open loops using smart reminders, adapting tone and delivery to individual work styles.',
            id: 'temp-4',
            name: 'Smart Follow-up',
            organizationId,
            pulseId: '',
            type: StrategyType.Missions,
            updatedAt: new Date().toISOString(),
          },
          {
            createdAt: new Date().toISOString(),
            description:
              'Maintain continuity by remembering prior interactions while respecting access boundaries, and continuously personalize insights to maximize engagement.',
            id: 'temp-5',
            name: 'Continuity',
            organizationId,
            pulseId: '',
            type: StrategyType.Missions,
            updatedAt: new Date().toISOString(),
          },
          {
            createdAt: new Date().toISOString(),
            description:
              'Your purpose is to turn every 1-2-1 into a high-leverage moment for alignment, accountability, and action.',
            id: 'temp-6',
            name: 'Purpose',
            organizationId,
            pulseId: '',
            type: StrategyType.Missions,
            updatedAt: new Date().toISOString(),
          },
        ]
      : []

  const [missions, setMissions] = useState<Strategy[]>(defaultMissions)
  const [automations, setAutomations] = useState<Strategy[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedMembers, setSelectedMembers] = useState<PulseMember[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMemberRole, setSelectedMemberRole] = useState<PulseMemberRole>(
    PulseMemberRole.Staff,
  )

  const startMissionEdit = () => {
    setIsMissionEditing(true)
  }

  const cancelMissionEdit = () => {
    setIsMissionEditing(false)
  }

  const saveMissionEdit = () => {
    setIsMissionEditing(false)
  }

  const handleUploadData = (
    fileKey: string,
    fileName: string,
    description?: string,
  ) => {
    if (!fileKey || !fileName) return

    const extension = fileName.split('.').pop() ?? 'txt'
    const type = extension.toLowerCase() as DataSourceType

    const newDataSource: DataSource = {
      description: description || `Uploaded file: ${fileName}`,
      fileKey,
      name: fileName,
      type,
    }

    setDataSources((prevDataSources) => {
      const fileExists = prevDataSources.some((ds) => ds.name === fileName)
      if (fileExists) {
        return prevDataSources
      }
      return [...prevDataSources, newDataSource]
    })
    toast.success('File uploaded successfully')
  }

  const handleRemoveDataSource = (fileKey: string) => {
    setDataSources((prev) => prev.filter((ds) => ds.fileKey !== fileKey))
    toast.success('Data source removed')
  }

  const handleMembersChange = (selectedMembers: PulseMember[]) => {
    setSelectedMembers(selectedMembers)
  }

  const onSubmit: SubmitHandler<PulseFormData> = async (data) => {
    try {
      if (!selectedIcon) {
        toast.error('Please select a pulse type')
        return
      }

      if (pulseType === 'one-on-one' && selectedMemberId === null) {
        toast.error('Please select at least one pulse member')
        return
      }

      setIsProcessingDataSources(true)

      const pulseInput = {
        dataSources: dataSources.map((source) => ({
          description: source.description,
          fileKey: source.fileKey,
          fileName: source.name,
          name: source.name,
          organizationId,
          type: source.type,
        })),
        members:
          pulseType === 'one-on-one'
            ? [
                {
                  role: selectedMemberRole,
                  userId: selectedMemberId,
                },
              ]
            : selectedMembers.map((member) => ({
                role: member.role || PulseMemberRole.Staff,
                userId: member.user.id,
              })),
        pulse: {
          category: pulseType === 'one-on-one' ? 'ONETOONE' : 'TEAM',
          icon: selectedIcon,
          name: data.companyName,
          organizationId,
        },
        strategies: [
          ...missions.map((mission) => ({
            description: mission.description,
            freeText: mission.name,
            name: mission.name,
            organizationId,
            type: StrategyType.Missions,
          })),
          ...automations.map((automation) => ({
            description: automation.description,
            freeText: automation.name,
            name: automation.name,
            organizationId,
            type: StrategyType.Automations,
          })),
        ],
      }

      const [result] = await Promise.all([
        createPulse(pulseInput as unknown as ProvisionPulseInput),
        new Promise((resolve) => setTimeout(resolve, 8000)), // Show loading for 8 seconds
      ])

      setIsProcessingDataSources(false)
      navigate(
        `/manager/${pathFor({
          pathname: Routes.PulseDetail,
          query: {
            organizationId,
            pulseId: result.createPulse.id,
          },
        })}`,
      )
    } catch (error) {
      setIsProcessingDataSources(false)
      toast.error('Failed to create pulse')
    }
  }

  return {
    automations,
    cancelMissionEdit,
    companyName,
    dataSources,
    handleFormSubmit: handleSubmit(onSubmit),
    handleIconSelect,
    handleMembersChange,
    handleRemoveDataSource,
    handleUploadData,
    isLoading,
    isMissionEditing,
    isValid,
    missionText,
    missions,
    register,
    saveMissionEdit,
    selectedIcon,
    selectedMemberId,
    setAutomations,
    setMissions,
    setSelectedMemberId,
    setSelectedMemberRole,
    startMissionEdit,
  }
}

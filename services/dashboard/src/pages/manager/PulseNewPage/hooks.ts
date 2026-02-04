import { PulseCategory, ThreadType } from '@zunou-graphql/core/graphql'
import { useCreatePulseMutation } from '@zunou-queries/core/hooks/useCreatePulseMutation'
import { useCreateTeamThreadMutation } from '@zunou-queries/core/hooks/useCreateTeamThreadMutation'
import { useCreateThreadMutation } from '@zunou-queries/core/hooks/useCreateThreadMutation'
import { useGetMasterPulsesQuery } from '@zunou-queries/core/hooks/useGetMasterPulsesQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useLoadingContext } from 'zunou-react/contexts/LoadingContext'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

export const useHooks = () => {
  const { organizationId } = useOrganization()
  const { loading, useTrackQuery } = useLoadingContext()
  const { userRole } = useAuthContext()
  const navigate = useNavigate()

  const { mutateAsync: createPulse, isPending: isPendingCreatePulse } =
    useCreatePulseMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })
  useTrackQuery(`${Routes.PulseNew}:createPulse`, isPendingCreatePulse)

  const { mutateAsync: createThread } = useCreateThreadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: createTeamThread } = useCreateTeamThreadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { data: masterPulsesData, isLoading: isLoadingMasterPulses } =
    useGetMasterPulsesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })
  useTrackQuery(`${Routes.PulseNew}:pulses`, isLoadingMasterPulses)

  const handleCreatePulse = async (id: string, name: string) => {
    try {
      const res = await createPulse({
        dataSources: [],
        members: [],
        pulse: {
          category: PulseCategory.Team,
          masterPulseId: id,
          name,
          organizationId,
        },
        strategies: [],
      })

      toast.success('Successfully created Pulse!')

      await Promise.all([
        createThread({
          name: res.createPulse.name,
          organizationId,
          pulseId: res.createPulse.id,
          type:
            userRole === UserRoleEnum.MANAGER
              ? ThreadType.Admin
              : ThreadType.User,
        }),
        createTeamThread({
          organizationId,
          pulseId: res.createPulse.id,
        }),
      ])

      navigate(
        `/manager/organizations/${organizationId}/pulse/${res.createPulse.id}`,
      )
    } catch (error) {
      toast.error('Error creating new pulse')
      console.error(error)
    }
  }

  const masterPulses = masterPulsesData?.masterPulses.data ?? []

  return {
    handleCreatePulse,
    loading,
    masterPulses,
  }
}

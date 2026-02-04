import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { GenerateJobDescriptionResponse } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ID } from 'graphql-ws'

interface GenerateJobDescriptionRes {
  generateJobDescription: GenerateJobDescriptionResponse
}

const GENERATE_JOB_DESCRIPTION__MUTATION = `
  mutation GenerateJobDescription($organizationUserId: ID!) {
    generateJobDescription(organizationUserId: $organizationUserId) {
      jobDescription
      responsibilities
    }
  }
`

export const useGenerateJobDescription = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  GenerateJobDescriptionRes,
  Error,
  ID
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (organizationUserId) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<GenerateJobDescriptionRes>(
        GENERATE_JOB_DESCRIPTION__MUTATION,
        {
          organizationUserId,
        },
      )
    },
  })
}

import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateInterestInput, Interest } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateInterestResponse {
  interest: Interest
}

const createInterestMutationDocument = graphql(/* GraphQL */ `
  mutation createInterestMutation($input: CreateInterestInput!) {
    createInterest(input: $input) {
      id
      name
      email
      company_name
      company_size
      looking_for
    }
  }
`)

export const useCreateInterestMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateInterestResponse,
  Error,
  CreateInterestInput
> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: CreateInterestInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateInterestResponse>(
        createInterestMutationDocument,
        { input },
      )
    },
  })
}

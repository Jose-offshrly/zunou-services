import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { GenerateEntitiesFromTextInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GenerateEntitiesFromTextResponse {
  generateEntitiesFromText: string
}

const GENERATE_ENTITIES_FROM_TEXT_MUTATION = graphql(/* GraphQL */ `
  mutation GenerateEntitiesFromText($input: GenerateEntitiesFromTextInput!) {
    generateEntitiesFromText(input: $input)
  }
`)

export const useGenerateEntitiesFromTextMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  GenerateEntitiesFromTextResponse,
  Error,
  GenerateEntitiesFromTextInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: GenerateEntitiesFromTextInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<GenerateEntitiesFromTextResponse>(
        GENERATE_ENTITIES_FROM_TEXT_MUTATION,
        {
          input,
        },
      )
    },
  })
}

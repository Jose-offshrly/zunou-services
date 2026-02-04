import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  DownloadUrl,
  GenerateDataScientistDownloadLinkInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GenerateDataScientistDownloadLinkReponse {
  generateDataScientistDownloadLink: DownloadUrl
}

const GENERATE_DATA_SCIENTIST_DOWNLOAD_LINK_MUTATION = graphql(/* GraphQL */ `
  mutation GenerateDataScientistDownloadLink(
    $input: GenerateDataScientistDownloadLinkInput!
  ) {
    generateDataScientistDownloadLink(input: $input) {
      url
    }
  }
`)

export const useGenerateDataScientistDownloadLinkMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  GenerateDataScientistDownloadLinkReponse,
  Error,
  GenerateDataScientistDownloadLinkInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: GenerateDataScientistDownloadLinkInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<GenerateDataScientistDownloadLinkReponse>(
        GENERATE_DATA_SCIENTIST_DOWNLOAD_LINK_MUTATION,
        {
          input,
        },
      )
    },
  })
}

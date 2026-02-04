import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  DownloadUrl,
  GenerateDataSourceDownloadLinkInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GenerateDataSourceDownloadLinkReponse {
  generateDataSourceDownloadLink: DownloadUrl
}

const GENERATE_DATA_SOURCE_DOWNLOAD_LINK_MUTATION = graphql(/* GraphQL */ `
  mutation GenerateDataSourceDownloadLink(
    $input: GenerateDataSourceDownloadLinkInput!
  ) {
    generateDataSourceDownloadLink(input: $input) {
      url
    }
  }
`)

export const useGenerateDataSourceDownloadLinkMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  GenerateDataSourceDownloadLinkReponse,
  Error,
  GenerateDataSourceDownloadLinkInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: GenerateDataSourceDownloadLinkInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<GenerateDataSourceDownloadLinkReponse>(
        GENERATE_DATA_SOURCE_DOWNLOAD_LINK_MUTATION,
        {
          input,
        },
      )
    },
  })
}

import { graphql } from '@zunou-graphql/core/gql'
import { GenerateUploadCredentialsInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

const GENERATE_LIVE_UPLOAD_CREDENTIALS_MUTATION = graphql(/* GraphQL */ `
  mutation GenerateLiveUploadCredentials(
    $input: GenerateUploadCredentialsInput!
  ) {
    generateLiveUploadCredentials(input: $input) {
      key
      url
    }
  }
`)

export const generateLiveUploadCredentialsMutation = async (
  endpoint: string,
  token: string | null,
  input: GenerateUploadCredentialsInput,
) => {
  const data = await gqlClient(endpoint, token).request(
    GENERATE_LIVE_UPLOAD_CREDENTIALS_MUTATION,
    {
      input,
    },
  )

  return data
}

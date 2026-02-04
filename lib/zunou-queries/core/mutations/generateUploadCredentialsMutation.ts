import { graphql } from '@zunou-graphql/core/gql'
import { GenerateUploadCredentialsInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

const GENERATE_UPLOAD_CREDENTIALS_MUTATION = graphql(/* GraphQL */ `
  mutation GenerateUploadCredentials($input: GenerateUploadCredentialsInput!) {
    generateUploadCredentials(input: $input) {
      key
      url
    }
  }
`)

export const generateUploadCredentialsMutation = async (
  endpoint: string,
  token: string | null,
  input: GenerateUploadCredentialsInput,
) => {
  const data = await gqlClient(endpoint, token).request(
    GENERATE_UPLOAD_CREDENTIALS_MUTATION,
    {
      input,
    },
  )

  return data
}

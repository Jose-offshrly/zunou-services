import { graphql } from '@zunou-graphql/core/gql'
import { CreateLiveUploadInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

const CREATE_LIVE_UPLOAD_MUTATION = graphql(/* GraphQL */ `
  mutation createLiveUpload($input: CreateLiveUploadInput!) {
    createLiveUpload(input: $input) {
      fileKey
      userId
      status
      fullContent
      summaryContent
      createdAt
      updatedAt
      id
    }
  }
`)

export const createLiveUploadMutation = async (
  endpoint: string,
  token: string | null,
  input: CreateLiveUploadInput,
) => {
  const data = await gqlClient(endpoint, token).request(
    CREATE_LIVE_UPLOAD_MUTATION,
    {
      input,
    },
  )

  return data
}

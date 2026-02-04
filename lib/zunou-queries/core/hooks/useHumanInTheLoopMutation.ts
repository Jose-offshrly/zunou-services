import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { UserSpeakerMapInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { Variables } from 'graphql-request'

interface HumanInTheLoopInput {
  bot_meeting_id: string
  transcript_id: string
  maps: UserSpeakerMapInput[]
}

interface HumanInTheLoopResponse {
  data: {
    humanInTheLoop: boolean
  }
}

const HUMAN_IN_THE_LOOP_MUTATION_DOCUMENT = graphql(`
  mutation HumanInTheLoop(
    $bot_meeting_id: String!
    $transcript_id: String!
    $maps: [UserSpeakerMapInput!]!
  ) {
    humanInTheLoop(
      bot_meeting_id: $bot_meeting_id
      transcript_id: $transcript_id
      maps: $maps
    )
  }
`)

export const useHumanInTheLoopMutation = ({ coreUrl }: MutationOptions) => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: HumanInTheLoopInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<HumanInTheLoopResponse>(
        HUMAN_IN_THE_LOOP_MUTATION_DOCUMENT,
        { ...input } as Variables,
      )
    },

    onError: (error) => {
      console.error('Error calling human in the loop mutation:', error)
    },
  })
}

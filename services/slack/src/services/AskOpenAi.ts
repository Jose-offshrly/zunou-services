import { WebClient } from '@slack/web-api'
import { User } from '@zunou-graphql/core/graphql'
import { createCompletionMutation } from '@zunou-queries/core/mutations/createCompletionMutation'
import { getSlackCredentialsQuery } from '@zunou-queries/core/queries/getSlackCredentialsQuery'
import { getSlackUserQuery } from '@zunou-queries/core/queries/getSlackUserQuery'

import { getToken } from '~/services/Auth0'
import { coreGraphqlUrl, pulseDomain } from '~/services/Constants'

/**
 * Sends the user's message to Zunou AI.
 */
export const askOpenAi = async (
  slackTeamId: string,
  channelId: string,
  threadId: string,
  userId: string,
  message: string,
): Promise<void> => {
  // Find out the organization ID for this Slack team.
  const apiToken = await getToken()
  const { slackCredentials } = await getSlackCredentialsQuery(
    coreGraphqlUrl,
    apiToken,
    {
      slackTeamId,
    },
  )
  const { organizationId, slackAccessToken } = slackCredentials[0]
  if (!organizationId) {
    console.error('No organization is registered for this Slack team', {
      slackTeamId,
    })
    return
  }

  // The bot token can't reply - we need to use the user's token.
  const userClient = new WebClient(slackAccessToken)

  // Try to get a user for this Slack user ID.
  let user: User | undefined
  try {
    const { slackUser } = await getSlackUserQuery(coreGraphqlUrl, apiToken, {
      organizationId,
      slackId: userId,
    })
    user = slackUser
  } catch (err: unknown) {
    // No problem - the user is probably just not 'linked' yet.
    console.error(err as Error)
  }

  if (!user) {
    console.info('No user was found for this Slack user', userId)
    const link = `https://${pulseDomain}/organizations/${organizationId}/slack/users/${userId}`
    await userClient.chat.postMessage({
      channel: channelId,
      text: `You need to link your Slack account to Pulse to continue. Please click the link below:\n${link}`,
      thread_ts: threadId,
    })
    return
  }

  // Start a thread.
  const {
    message: { ts: placeholderId },
  } = await userClient.chat.postMessage({
    channel: channelId,
    text: '...',
    thread_ts: threadId,
  })

  const token = await getToken()

  let reply = `Sorry, I don't know the answer to that`
  try {
    const result = await createCompletionMutation(coreGraphqlUrl, token, {
      message,
      organizationId,
      threadId,
      userId: user.id,
    })

    if (result.createCompletion.length > 0) {
      reply = result.createCompletion.map((message) => message.content).join('')
    }
  } catch (err: unknown) {
    console.error('Failed to create completion', (err as Error).message)
    // Slack throws an error if the message is too long.
    reply = (err as Error).message.substring(0, 1000)
  }

  await userClient.chat.update({
    channel: channelId,
    mrkdwn: true,
    text: reply,
    ts: placeholderId,
  })

  return Promise.resolve()
}

import { isEmpty } from 'lodash'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const developmentVersion = 'unknown'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const productionVersion = '1.21.0'

const stagingVersion = '70.0.0-staging.1'

export const version = stagingVersion

export const listenPort = parseInt(process.env.PORT || '3000', 10)

export const logLevel = process.env.LOG_LEVEL || 'info'

export const coreGraphqlUrl = process.env.CORE_GRAPHQL_URL
if (isEmpty(coreGraphqlUrl)) {
  throw new Error('The CORE_GRAPHQL_URL environment variable must be set')
}

export const auth0Audience = process.env.AUTH0_AUDIENCE
if (isEmpty(auth0Audience)) {
  throw new Error('The AUTH0_AUDIENCE environment variable must be set')
}

export const auth0ClientId = process.env.AUTH0_M2M_CLIENT_ID
if (isEmpty(auth0ClientId)) {
  throw new Error('The AUTH0_M2M_CLIENT_ID environment variable must be set')
}

export const auth0ClientSecret = process.env.AUTH0_M2M_CLIENT_SECRET
if (isEmpty(auth0ClientSecret)) {
  throw new Error(
    'The AUTH0_M2M_CLIENT_SECRET environment variable must be set',
  )
}

export const auth0Domain = process.env.AUTH0_DOMAIN
if (isEmpty(auth0Domain)) {
  throw new Error('The AUTH0_DOMAIN environment variable must be set')
}

export const kestraBasicAuthPassword = process.env.KESTRA_BASIC_AUTH_PASSWORD
if (isEmpty(kestraBasicAuthPassword)) {
  throw new Error(
    'The KESTRA_BASIC_AUTH_PASSWORD environment variable must be set',
  )
}

export const kestraBasicAuthUsername = process.env.KESTRA_BASIC_AUTH_USERNAME
if (isEmpty(kestraBasicAuthUsername)) {
  throw new Error(
    'The KESTRA_BASIC_AUTH_USERNAME environment variable must be set',
  )
}

export const kestraLogEndpoint = process.env.KESTRA_LOG_ENDPOINT
if (isEmpty(kestraLogEndpoint)) {
  throw new Error('The KESTRA_LOG_ENDPOINT environment variable must be set')
}

export const pulseDomain = process.env.PULSE_DOMAIN
if (isEmpty(pulseDomain)) {
  throw new Error('The PULSE_DOMAIN environment variable must be set')
}

export const appToken = process.env.SLACK_APP_TOKEN
if (isEmpty(appToken)) {
  throw new Error('The SLACK_APP_TOKEN environment variable must be set')
}

export const botToken = process.env.SLACK_BOT_TOKEN
if (isEmpty(botToken)) {
  throw new Error('The SLACK_BOT_TOKEN environment variable must be set')
}

export const signingSecret = process.env.SLACK_SIGNING_SECRET
if (isEmpty(signingSecret)) {
  throw new Error('The SLACK_SIGNING_SECRET environment variable must be set')
}

export const slashCommand = process.env.SLACK_LISTEN_COMMAND
if (isEmpty(slashCommand)) {
  throw new Error('The SLACK_LISTEN_COMMAND environment variable must be set')
}

import { signInUserMutation } from '@zunou-queries/core/mutations/signInUserMutation'
import { access, readFile, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import {
  auth0Audience,
  auth0ClientId,
  auth0ClientSecret,
  auth0Domain,
  coreGraphqlUrl,
} from '~/services/Constants'

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface CachedToken {
  accessToken: string
  expiry: number
}

const TOKEN_CACHE_PATH = join(tmpdir(), 'auth0_token_cache.json')

export async function getToken(): Promise<string> {
  if (await isCachedTokenValid()) {
    const cachedToken = JSON.parse(
      await readFile(TOKEN_CACHE_PATH, { encoding: 'utf8' }),
    )

    return cachedToken.accessToken
  }

  const tokenResponse = await requestNewToken()
  const expiryTime = Date.now() + tokenResponse.expires_in * 1000

  await cacheToken(tokenResponse.access_token, expiryTime)

  await signInUserMutation(coreGraphqlUrl, tokenResponse.access_token, {
    name: 'Slack M2M',
  })

  return tokenResponse.access_token
}

async function isCachedTokenValid(): Promise<boolean> {
  try {
    await access(TOKEN_CACHE_PATH)
    const cachedToken: CachedToken = JSON.parse(
      await readFile(TOKEN_CACHE_PATH, { encoding: 'utf8' }),
    )
    return Date.now() < cachedToken.expiry
  } catch (error) {
    return false
  }
}

async function requestNewToken(): Promise<TokenResponse> {
  const response = await fetch(`https://${auth0Domain}/oauth/token`, {
    body: JSON.stringify({
      audience: auth0Audience,
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      grant_type: 'client_credentials',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Error fetching token: ${response.statusText}`)
  }

  return response.json()
}

async function cacheToken(accessToken: string, expiry: number): Promise<void> {
  const tokenData: CachedToken = { accessToken, expiry }
  await writeFile(TOKEN_CACHE_PATH, JSON.stringify(tokenData), {
    encoding: 'utf8',
  })
}

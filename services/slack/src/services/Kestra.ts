import {
  kestraBasicAuthPassword,
  kestraBasicAuthUsername,
  kestraLogEndpoint,
} from '~/services/Constants'

export const logToKestra = (payload: object) => {
  fetch(kestraLogEndpoint, {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Basic ${Buffer.from(`${kestraBasicAuthUsername}:${kestraBasicAuthPassword}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).catch((err) => {
    console.error('Failed to log to Kestra', err)
  })
}

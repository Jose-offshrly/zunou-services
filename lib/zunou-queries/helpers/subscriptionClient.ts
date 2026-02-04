import { Client, createClient } from 'graphql-ws'
import WebSocket from 'ws'

export const subscriptionClient = (
  url: string,
  token: string | undefined,
): Client => {
  const WebSocketWithToken = class extends WebSocket {
    constructor(address: string, protocols?: string | string[]) {
      super(address, protocols, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    }
  }

  const client = createClient({
    connectionParams: () => {
      return {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    },
    url,
    webSocketImpl: WebSocketWithToken,
  })

  return client
}

import { GraphQLClient } from 'graphql-request'

export const gqlClient = (
  url: string,
  token: string | null,
  signal?: AbortSignal,
) => {
  return new GraphQLClient(url, {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        signal,
      }),
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

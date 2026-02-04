import { useQuery } from '@tanstack/react-query'

const GET_USER_QUERY = `
  query GetUser {
    me {
      id
      name
      email
      createdAt
      updatedAt
      google_calendar_linked
    }
  }
`

interface UserResponse {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
  google_calendar_linked: boolean
}

interface GraphQLError {
  message: string
}

interface GraphQLResult {
  data?: {
    me: UserResponse | null
  }
  errors?: GraphQLError[]
}

export const useGetUserQuery = (token: string | null) => {
  return useQuery({
    enabled: !!token,
    queryFn: async () => {
      try {
        if (!token) {
          throw new Error('No authentication token available')
        }

        const response = await fetch(
          import.meta.env.VITE_CORE_GRAPHQL_URL as string,
          {
            body: JSON.stringify({
              query: GET_USER_QUERY,
            }),
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = (await response.json()) as GraphQLResult

        if (result.errors?.length) {
          throw new Error(result.errors[0].message)
        }

        if (!result.data?.me) {
          throw new Error('Invalid response from server')
        }

        return result.data.me
      } catch (error) {
        console.error('GraphQL Error:', error)
        throw error
      }
    },
    queryKey: ['user', 'google_calendar_linked'],
  })
}

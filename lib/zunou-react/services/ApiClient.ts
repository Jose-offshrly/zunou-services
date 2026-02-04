export interface ApiClientConfig {
  baseUrl: string
  getToken: (forceRefresh?: boolean) => Promise<string | null>
  onAuthError?: () => void
}

interface GraphQLError {
  message: string
  locations?: { line: number; column: number }[]
  path?: string[]
}

interface GraphQLResult<T = unknown> {
  data?: T
  errors?: GraphQLError[]
}

export class ApiClient {
  private config: ApiClientConfig
  private refreshPromise: Promise<string | null> | null = null

  constructor(config: ApiClientConfig) {
    this.config = config
  }

  async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<Response> {
    const forceRefresh = retryCount > 0 // Force refresh on retry
    const token = await this.getValidToken(forceRefresh)

    if (!token) {
      throw new Error('No valid authentication token available')
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    // Handle token expiration with retry
    if (response.status === 401 && retryCount < 1) {
      console.log('Token expired, refreshing and retrying...')

      // Clear any cached promise and retry with force refresh
      this.refreshPromise = null
      return this.makeRequest(endpoint, options, retryCount + 1)
    }

    // Handle other auth errors
    if (response.status === 401 || response.status === 403) {
      this.config.onAuthError?.()
      throw new Error('Authentication failed')
    }

    return response
  }

  async graphqlRequest<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.makeRequest('', {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`)
    }

    const result = (await response.json()) as GraphQLResult<T>

    if (result.errors?.length) {
      // Check if it's an auth error
      const authErrors = [
        'Invalid Token',
        'Authentication required',
        'Authentication failed',
      ]
      const hasAuthError = result.errors.some((error: GraphQLError) =>
        authErrors.some((authErr) => error.message?.includes(authErr)),
      )

      if (hasAuthError) {
        this.config.onAuthError?.()
      }

      const errorMessage = result.errors[0]?.message || 'GraphQL error occurred'
      throw new Error(errorMessage)
    }

    return result.data as T
  }

  private async getValidToken(forceRefresh = false): Promise<string | null> {
    // If we're already refreshing and not forcing, wait for it
    if (this.refreshPromise && !forceRefresh) {
      return this.refreshPromise
    }

    // Start refresh process
    this.refreshPromise = this.config.getToken(forceRefresh)

    try {
      const token = await this.refreshPromise
      return token
    } catch (error) {
      console.error('Failed to get valid token:', error)
      return null
    } finally {
      // Clear the promise after 1 second to allow fresh attempts
      setTimeout(() => {
        this.refreshPromise = null
      }, 1000)
    }
  }
}

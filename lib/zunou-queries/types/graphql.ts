export interface QueryOptions {
  enabled?: boolean
  coreUrl: string
  variables?: Record<string, unknown>
}

export interface MutationOptions {
  enabled?: boolean
  coreUrl: string
  variables?: Record<string, unknown>
}

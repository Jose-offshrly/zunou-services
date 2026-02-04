import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  DateRangeInput,
  Task,
  TaskOrder,
  TaskPriority,
  TaskStatus,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

export interface GetTasksQueryResponse {
  tasks: Task[]
}

export interface TaskFilters {
  assigneeId?: string | null
  date?: string | null
  dateRange?: DateRangeInput | null
  entityId?: string | null
  status?: TaskStatus | null
  priority?: TaskPriority | null
  search?: string
  isPersonalTasks?: boolean | null
  showCompletedTasks?: boolean
  excludeStatus?: TaskStatus | null
  excludePriority?: TaskPriority | null
  excludeAssigneeId?: string | null
  excludeWithChildren?: boolean
  // Custom status filters (for pulses using custom statuses)
  taskStatusId?: string | null
  excludeTaskStatusId?: string | null
}

export type TaskQueryVariables = TaskFilters & {
  entityId?: string
  organizationId: string
  userId?: string
  orderBy?: TaskOrder
  isScheduled?: boolean
}

export const getTasksQueryKey = (filters: TaskQueryVariables) => {
  return [
    'tasks',
    filters.entityId,
    filters.organizationId,
    filters.assigneeId,
    filters.date,
    filters.dateRange,
    filters.priority,
    filters.search,
    filters.status,
    filters.userId,
    filters.excludeStatus,
    filters.excludePriority,
    filters.excludeAssigneeId,
    filters.excludeWithChildren,
    filters.isScheduled,
  ]
}

const getTasksQueryDocument = graphql(/* GraphQL */ `
  query GetTasks(
    $organizationId: String!
    $entityId: String
    $priority: TaskPriority
    $status: TaskStatus
    $date: Date
    $dateRange: DateRangeInput
    $assigneeId: String
    $search: String
    $userId: String
    $excludeStatus: TaskStatus
    $excludePriority: TaskPriority
    $excludeAssigneeId: String
    $excludeWithChildren: Boolean
    $isScheduled: Boolean
  ) {
    tasks(
      organizationId: $organizationId
      entityId: $entityId
      priority: $priority
      status: $status
      date: $date
      dateRange: $dateRange
      assigneeId: $assigneeId
      search: $search
      userId: $userId
      excludeStatus: $excludeStatus
      excludePriority: $excludePriority
      excludeAssigneeId: $excludeAssigneeId
      excludeWithChildren: $excludeWithChildren
      isScheduled: $isScheduled
    ) {
      id
      assignees {
        id
        user {
          id
          name
          gravatar
        }
      }
      parent {
        id
        title
      }
      description
      due_date
      start_date
      priority
      status
      color
      task_status_id
      taskStatus {
        id
        label
        color
      }
      title
      type
      task_number
      entity {
        id
        name
      }
      dependencies {
        id
      }
      dependents {
        id
      }
      children(
        assigneeId: $assigneeId
        priority: $priority
        status: $status
        date: $date
        dateRange: $dateRange
        search: $search
      ) {
        ...TaskChildFragment
      }
      order
    }
  }
`)

export const useGetTasksQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<GetTasksQueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  // Set excludeWithChildren to true by default
  const variablesWithDefaults = {
    ...(variables || {}),
    excludeWithChildren: variables?.excludeWithChildren ?? true,
  } as TaskQueryVariables

  const generatedQueryKey = getTasksQueryKey(variablesWithDefaults)

  return useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request(
        getTasksQueryDocument,
        variablesWithDefaults,
      )
      return result
    },
    queryKey: generatedQueryKey,
  })
}

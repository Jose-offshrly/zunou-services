import type {
  InfiniteData,
  UseInfiniteQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type {
  MutationOptions,
  QueryOptions,
} from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

// Strict input type matching backend
export interface DirectMessageThreadPaginationInput {
  organizationId: string
  receiverId: string
  page?: number
}

// Strict message and response types matching backend
export interface DirectMessageSender {
  id: string
  name: string
  email: string
  gravatar?: string | null
}

export interface DirectMessageFile {
  id: string
  path: string
  file_name?: string | null
  type?: string | null
  size?: number | null
  entity_type: string
  entity_id: string
  pulse_id?: string | null
  organization_id: string
  created_at: string
  updated_at: string
  dataSourceId?: string | null
  url?: string | null
}

export interface DirectMessage {
  id: string
  directMessageThreadId: string
  content: string
  createdAt: string
  updatedAt: string
  isEdited: boolean
  deletedAt?: string | null
  isRead: boolean
  isPinned: boolean
  repliedToMessageId?: string | null
  repliedToMessage?: DirectMessage | null
  sender: DirectMessageSender
  files?: DirectMessageFile[] | null
}

export interface PaginatorInfo {
  count: number
  currentPage: number
  firstItem: number
  hasMorePages: boolean
  lastItem: number
  lastPage: number
  perPage: number
  total: number
}

export interface GetOrCreateDirectMessageThreadResponse {
  getOrCreateDirectMessageThread: {
    threadId: string
    data: DirectMessage[]
    paginatorInfo: PaginatorInfo
  }
}

const getOrCreateDirectMessageThreadMutationDocument = graphql(/* GraphQL */ `
  mutation GetOrCreateDirectMessageThread(
    $input: DirectMessageThreadPaginationInput!
  ) {
    getOrCreateDirectMessageThread(input: $input) {
      threadId
      paginatorInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
      data {
        id
        directMessageThreadId
        content
        createdAt
        updatedAt
        isEdited
        deletedAt
        isRead
        isPinned
        repliedToMessageId
        groupedReactions {
          reaction
          count
          users {
            id
            name
            email
            gravatar
            createdAt
            updatedAt
            google_calendar_linked
            onboarded
            picture
            permissions
          }
        }
        repliedToMessage {
          id
          directMessageThreadId
          content
          createdAt
          updatedAt
          isEdited
          deletedAt
          isRead
          isPinned
          repliedToMessageId
          files {
            id
            path
            file_name
            type
            size
            entity_type
            entity_id
            pulse_id
            organization_id
            created_at
            updated_at
            dataSourceId
            url
          }
          sender {
            id
            name
            email
            gravatar
          }
        }
        sender {
          id
          name
          email
          gravatar
        }
        files {
          id
          path
          file_name
          type
          size
          entity_type
          entity_id
          pulse_id
          organization_id
          created_at
          updated_at
          dataSourceId
          url
        }
      }
    }
  }
`)

// Infinite query hook for pagination support
export const useGetOrCreateDirectMessageThreadQuery = ({
  coreUrl,
  variables,
}: QueryOptions): UseInfiniteQueryResult<
  InfiniteData<
    GetOrCreateDirectMessageThreadResponse['getOrCreateDirectMessageThread']
  >
> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const fetchDirectMessageThread = async ({
    pageParam = 1,
  }: {
    pageParam?: number
  }): Promise<
    GetOrCreateDirectMessageThreadResponse['getOrCreateDirectMessageThread']
  > => {
    const token = await getToken()

    const result = await gqlClient(
      coreUrl,
      token,
    ).request<GetOrCreateDirectMessageThreadResponse>(
      getOrCreateDirectMessageThreadMutationDocument,
      { input: { ...variables, page: pageParam } },
    )

    return result.getOrCreateDirectMessageThread
  }

  const response = useInfiniteQuery({
    enabled:
      isAuthenticated && !!variables?.organizationId && !!variables?.receiverId,
    getNextPageParam: (lastPage) => {
      if (
        lastPage.paginatorInfo.hasMorePages &&
        lastPage.data.length > 0 &&
        lastPage.paginatorInfo.currentPage < lastPage.paginatorInfo.lastPage
      ) {
        return lastPage.paginatorInfo.currentPage + 1
      }

      return undefined
    },
    initialPageParam: 1,
    queryFn: fetchDirectMessageThread,
    queryKey: [
      'getOrCreateDirectMessageThread',
      variables?.organizationId,
      variables?.receiverId,
    ],
  })

  return response
}

export const useGetOrCreateDirectMessageThreadMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  GetOrCreateDirectMessageThreadResponse,
  Error,
  DirectMessageThreadPaginationInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DirectMessageThreadPaginationInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<GetOrCreateDirectMessageThreadResponse>(
        getOrCreateDirectMessageThreadMutationDocument,
        { input },
      )
    },
    onSuccess: (data, variables) => {
      const threadData = data.getOrCreateDirectMessageThread

      const infiniteQueryKey = [
        'getOrCreateDirectMessageThread',
        variables.organizationId,
        variables.receiverId,
      ]

      const existingData =
        queryClient.getQueryData<
          InfiniteData<
            GetOrCreateDirectMessageThreadResponse['getOrCreateDirectMessageThread']
          >
        >(infiniteQueryKey)

      if (existingData) {
        const pageIndex = (variables.page || 1) - 1
        const updatedPages = [...existingData.pages]

        if (pageIndex < updatedPages.length) {
          updatedPages[pageIndex] = threadData
        } else {
          updatedPages.push(threadData)
        }

        queryClient.setQueryData<
          InfiniteData<
            GetOrCreateDirectMessageThreadResponse['getOrCreateDirectMessageThread']
          >
        >(infiniteQueryKey, {
          pageParams: existingData.pageParams,
          pages: updatedPages,
        })
      } else {
        queryClient.setQueryData<
          InfiniteData<
            GetOrCreateDirectMessageThreadResponse['getOrCreateDirectMessageThread']
          >
        >(infiniteQueryKey, {
          pageParams: [1],
          pages: [threadData],
        })
      }

      queryClient.invalidateQueries({
        queryKey: ['directMessageThreads'],
      })
      queryClient.invalidateQueries({
        queryKey: ['directMessageThread', variables.organizationId],
      })
      queryClient.invalidateQueries({
        queryKey: ['directMessages', variables.organizationId],
      })
    },
  })
}

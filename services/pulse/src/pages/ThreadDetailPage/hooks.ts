import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import { useGetMessagesQuery } from '@zunou-queries/core/hooks/useGetMessagesQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useParams } from 'react-router-dom'

import { zodResolver } from '~/libs/zod'
import { ThreadParams, threadSchema } from '~/schemas/ThreadSchema'

const allowedFileTypes = [
  '.csv',
  '.doc',
  '.docx',
  '.html',
  '.markdown',
  '.md',
  '.pdf',
  '.ppt',
  '.pptx',
  '.rtf',
  '.txt',
  '.xls',
  '.xlsx',
]

const initialFormState = {
  file: null,
  message: '',
}

export const useHooks = () => {
  const { organizationId, threadId } = useParams()
  const [isLoading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const { getToken } = useAuthContext()

  if (!organizationId) throw new Error('Organization ID not found.')

  const {
    control,
    formState: { isValid },
    handleSubmit,
    register,
    reset,
    setValue,
    resetField,
  } = useForm<ThreadParams>({
    defaultValues: initialFormState,
    mode: 'onChange',
    resolver: zodResolver(threadSchema),
  })

  useEffect(() => {
    const fetchToken = async () => {
      const t = await getToken()
      setToken(t)
    }
    fetchToken()
  }, [getToken])

  const { files } = useWatch({ control })

  const observer: MutableRefObject<IntersectionObserver | null> = useRef(null)

  const {
    isPending: isPendingCompletionCreation,
    mutateAsync: createCompletion,
  } = useCreateCompletionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    data: messageData,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetMessagesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      threadId: threadId || '',
    },
  })

  const lastMessageElementRef = (node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage()
      }
    })

    if (node) observer.current.observe(node)
  }

  const onSubmit = async (data: ThreadParams) => {
    const { files, message } = data
    reset(initialFormState)

    if (!organizationId) throw new Error('Organization ID is missing')
    if (!threadId) throw new Error('Thread ID is missing')

    if (message || files) {
      try {
        const threadMessage =
          message || (files && files[0] ? files[0].name : '')

        await createCompletion({
          message: threadMessage,
          organizationId,
          threadId,
        })

        /** NOTE: Temporarily removed for v0.1 */
        // if (files && files[0]) {
        //   await createLiveUploadMutation(coreGraphQLURL, token, {
        //     fileKey: 'sample',
        //     organizationId,
        //     threadId,
        //     userId: user.id,
        //   })
        // }
      } catch (error) {
        console.error('Error creating thread or sending message:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (threadId) {
      refetchMessages()
    }
  }, [threadId, refetchMessages])

  useEffect(() => {
    const container = containerRef.current

    if (container) {
      container.scrollTo({
        behavior: 'smooth',
        top: container.scrollHeight,
      })
    }
  }, [messageData, isFetching])

  return {
    allowedFileTypes,
    containerRef,
    files,
    handleSubmit: handleSubmit(onSubmit),
    isFetching,
    isLoading,
    isLoadingMessages,
    isPendingCompletionCreation,
    isValid,
    lastMessageElementRef,
    messageData,
    organizationId,
    register,
    resetField,
    setValue,
    token,
  }
}

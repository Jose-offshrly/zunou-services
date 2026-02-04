import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import { useCreateThreadMutation } from '@zunou-queries/core/hooks/useCreateThreadMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { zodResolver } from '~/libs/zod'
import { ThreadParams, threadSchema } from '~/schemas/ThreadSchema'

/** NOTE: Temporarily removed for v0.1 */
// import { createLiveUploadMutation } from '@zunou-queries/core/mutations/createLiveUploadMutation'

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

/** NOTE: Temporarily removed for v0.1 */
// const coreGraphQLURL = import.meta.env.VITE_CORE_GRAPHQL_URL

export const useHooks = () => {
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const [isLoading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const {
    getToken,
    // user // NOTE: Removed in v0.1
  } = useAuthContext()

  useEffect(() => {
    const fetchToken = async () => {
      const t = await getToken()
      setToken(t)
    }
    fetchToken()
  }, [getToken])

  if (!organizationId) throw new Error('Organization ID not found.')

  const {
    control,
    formState: { isValid },
    handleSubmit,
    register,
    reset,
    resetField,
    setValue,
  } = useForm<ThreadParams>({
    defaultValues: initialFormState,
    mode: 'onChange',
    resolver: zodResolver(threadSchema),
  })

  const { files } = useWatch({ control })

  const {
    isPending: isPendingCompletionCreation,
    mutateAsync: createCompletion,
  } = useCreateCompletionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: createThread } = useCreateThreadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  /**
   * TODO: Refactor and create separate functions.
   *   - uploadFile()
   *   - createThreadMessage()
   *
   * Reason: Single Responsibility Principle
   * */
  const onSubmit = async (data: ThreadParams) => {
    const { files, message } = data

    reset(initialFormState)

    if (message || files) {
      try {
        const threadMessage =
          message || (files && files[0] ? files[0].name : '')
        setLoading(true)

        const response = await createThread({
          name: threadMessage,
          organizationId,
          type: 'user',
        })

        await createCompletion({
          message: threadMessage,
          organizationId,
          threadId: response.createThread.id,
        })

        /** NOTE: Temporarily removed for v0.1 */
        // if (files && files[0]) {
        //   await createLiveUploadMutation(coreGraphQLURL, token, {
        //     fileKey: 'sample',
        //     organizationId,
        //     threadId: response.createThread.id,
        //     userId: user?.id ?? '',
        //   })
        // }

        navigate(
          `/organizations/${organizationId}/threads/${response.createThread.id}`,
        )
      } catch (error) {
        console.error('Error creating thread or sending message:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return {
    allowedFileTypes,
    containerRef,
    files,
    handleSubmit: handleSubmit(onSubmit),
    isLoading,
    isPendingCompletionCreation,
    isValid,
    organizationId,
    register,
    resetField,
    setValue,
    token,
  }
}

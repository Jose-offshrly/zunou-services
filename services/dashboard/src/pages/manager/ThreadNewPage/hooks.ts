import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import { useCreateThreadMutation } from '@zunou-queries/core/hooks/useCreateThreadMutation'
// import { createLiveUploadMutation } from '@zunou-queries/core/mutations/createLiveUploadMutation' // NOTE: Removed in v0.1
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { z, zodResolver } from '~/libs/zod'

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

const threadSchema = z
  .object({
    files: z.instanceof(FileList).optional().nullable(),
    message: z.string().optional().nullable(),
  })
  .refine((data) => data.message || (data.files && data.files.length > 0), {
    message: 'Either message or file must be provided.',
  })

type ThreadParams = z.infer<typeof threadSchema>

const initialFormState = {
  file: null,
  message: '',
}

// NOTE: Temporarily removed in v0.1
// const coreGraphQLURL = import.meta.env.VITE_CORE_GRAPHQL_URL

export const useHooks = () => {
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const [isLoading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const {
    getToken,
    // user // NOTE: Removed in v0.1
  } = useAuthContext()

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

    if (!organizationId) throw new Error('Organization ID is missing')

    if (message || files) {
      try {
        setLoading(true)

        const threadMessage =
          message || (files && files[0] ? files[0].name : '')

        const response = await createThread({
          name: threadMessage,
          organizationId,
          type: 'admin',
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
        //     userId: user?.id ?? ''
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

  useEffect(() => {
    const fetchToken = async () => {
      const t = await getToken()
      setToken(t)
    }
    fetchToken()
  }, [getToken])

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

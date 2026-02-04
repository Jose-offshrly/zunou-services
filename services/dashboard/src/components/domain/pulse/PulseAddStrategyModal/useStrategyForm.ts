import { StrategyType } from '@zunou-graphql/core/graphql'
import { useCreateStrategyDescriptionMutation } from '@zunou-queries/core/hooks/useCreateStrategyDescriptionMutation'
import { useCallback, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useOrganization } from '~/hooks/useOrganization'
import { zodResolver } from '~/libs/zod'
import {
  StrategyFormData,
  strategyFormSchema,
} from '~/schemas/StrategiesSchema'

interface UseStrategyFormProps {
  draftDescription?: string
  draftTitle?: string
  isConfirmation: boolean
  onSubmit: (data: StrategyFormData) => void
  onDelete?: () => void
  type: StrategyType
  prompt_description?: string
}

export const useStrategyForm = ({
  draftDescription = '',
  draftTitle,
  isConfirmation,
  onSubmit,
  onDelete,
  type,
  prompt_description,
}: UseStrategyFormProps) => {
  const { organizationId } = useOrganization()

  const [isConfirmationScreen, setIsConfirmationScreen] =
    useState(isConfirmation)
  const [isDeleteConfirmationScreen, setIsDeleteConfirmationScreen] =
    useState(false)
  const [isEditingAiResponse, setIsEditingAiResponse] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const {
    mutateAsync: createStrategyDescription,
    isPending: isPendingCreateStrategyDescription,
  } = useCreateStrategyDescriptionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    control,
    handleSubmit,
    formState: { isValid, errors, touchedFields },
    reset,
    setValue,
  } = useForm<StrategyFormData>({
    defaultValues: {
      description: draftDescription,
      name: draftTitle ? draftTitle : `Untitled ${type}`,
      prompt_description,
    },
    mode: 'onBlur',
    resolver: zodResolver(strategyFormSchema),
  })

  const formValues = useWatch({
    control,
  })

  const { description, name } = formValues

  const handleGenerateDescription = useCallback(
    (data: StrategyFormData) => {
      if (!organizationId) return

      setIsConfirmationScreen(true)
      createStrategyDescription(
        {
          freeText: data.description,
          organizationId,
          type: type,
        },
        {
          onError: (error) => {
            console.error(error)
            setIsConfirmationScreen(false)
          },
          onSuccess: ({ createStrategyDescription }) => {
            setValue('description', createStrategyDescription.description)
            setValue('name', createStrategyDescription.title)
            setValue(
              'prompt_description',
              createStrategyDescription.prompt_description,
            )
            setIsSuccess(createStrategyDescription.isSuccess)
          },
        },
      )
    },
    [createStrategyDescription, setValue, type],
  )

  const handleConfirmationSubmit = useCallback(() => {
    if (!description || !name) return
    setIsConfirmed(true)

    onSubmit({
      description: description,
      name: name,
      prompt_description: formValues.prompt_description,
    })
  }, [description, name, onSubmit, formValues.prompt_description])

  const resetForm = useCallback(() => {
    setIsConfirmationScreen(isConfirmation)
    setIsDeleteConfirmationScreen(false)
    reset()
  }, [isConfirmation, reset])

  const handleDeleteClick = useCallback(() => {
    setIsDeleteConfirmationScreen(true)
  }, [])

  const handleCancelDelete = useCallback(() => {
    setIsDeleteConfirmationScreen(false)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (onDelete) {
      onDelete()
    }
  }, [onDelete])

  return {
    control,
    errors,
    formValues: { description, name },
    handleCancelDelete,
    handleConfirmDelete,
    handleConfirmationSubmit,
    handleDeleteClick,
    handleGenerateDescription,
    handleSubmit,
    isConfirmationScreen,
    isConfirmed,
    isDeleteConfirmationScreen,
    isEditingAiResponse,
    isPendingCreateStrategyDescription,
    isSuccess,
    isValid,
    prompt_description: formValues.prompt_description,
    resetForm,
    setIsConfirmationScreen,
    setIsEditingAiResponse,
    touchedFields,
  }
}

import { DeleteOutline } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { StrategyType } from '@zunou-graphql/core/graphql'
import { ActionButton } from '@zunou-react/components/layout'
import { useEffect } from 'react'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { StrategyFormData } from '~/schemas/StrategiesSchema'

import { ConfirmationScreen } from './ConfirmationScreen'
import { DescriptionTextField } from './DescriptionTextField'
import { useStrategyForm } from './useStrategyForm'

interface PulseAddStrategyModalProps {
  title: string
  subheader: string | undefined
  isOpen: boolean
  type: StrategyType
  onClose: () => void
  onSubmit: (data: StrategyFormData) => void
  onDelete?: () => void
  isSubmitting?: boolean
  isConfirmation: boolean
  draftTitle?: string
  draftDescription?: string
  headerActions?: ActionButton[]
  prompt_description?: string
  isSuccess?: boolean
}

export const PulseAddStrategyModal = ({
  title,
  subheader,
  isOpen,
  type,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting = false,
  isConfirmation,
  draftTitle,
  draftDescription = '',
  headerActions,
  isSuccess: propIsSuccess,
  prompt_description: propPromptDescription,
}: PulseAddStrategyModalProps) => {
  const {
    control,
    errors,
    formValues: { description, name },
    handleCancelDelete,
    handleConfirmationSubmit,
    handleConfirmDelete,
    handleDeleteClick,
    handleGenerateDescription,
    handleSubmit,
    isConfirmed,
    isConfirmationScreen,
    isDeleteConfirmationScreen,
    isEditingAiResponse,
    isPendingCreateStrategyDescription,
    isSuccess: hookIsSuccess,
    prompt_description: hookPromptDescription,
    isValid,
    resetForm,
    setIsConfirmationScreen,
    setIsEditingAiResponse,
    touchedFields,
  } = useStrategyForm({
    draftDescription,
    draftTitle,
    isConfirmation,
    onDelete,
    onSubmit,
    prompt_description: propPromptDescription,
    type,
  })

  const isSuccess = propIsSuccess ?? hookIsSuccess
  const promptDescription = propPromptDescription ?? hookPromptDescription

  useEffect(() => {
    setIsConfirmationScreen(isConfirmation)
  }, [isConfirmation, setIsConfirmationScreen])

  const enhancedHeaderActions = onDelete
    ? [
        ...(headerActions || []),
        {
          ariaLabel: 'Delete strategy',
          icon: DeleteOutline,
          onClick: handleDeleteClick,
        },
      ]
    : headerActions

  const handleModalClose = () => {
    resetForm()
    onClose()
  }

  return (
    <CustomModalWithSubmit
      disabledSubmit={!isValid}
      headerActions={
        isDeleteConfirmationScreen ? undefined : enhancedHeaderActions
      }
      isEditable={!isConfirmationScreen}
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      onCancel={handleModalClose}
      onClose={
        isDeleteConfirmationScreen ? handleCancelDelete : handleModalClose
      }
      onSubmit={
        isDeleteConfirmationScreen
          ? handleSubmit(handleConfirmDelete)
          : isConfirmationScreen
            ? handleConfirmationSubmit
            : handleSubmit(handleGenerateDescription)
      }
      subheader={isDeleteConfirmationScreen ? undefined : subheader}
      submitText={isDeleteConfirmationScreen ? 'Delete' : 'Submit'}
      title={isDeleteConfirmationScreen ? 'Delete Strategy' : title}
    >
      {isDeleteConfirmationScreen ? (
        <Stack alignItems="center">
          <Typography color="text.secondary" variant="body2">
            {name
              ? `Are you sure you want to delete "${name}"?`
              : 'Are you sure you want to delete this strategy?'}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            This action cannot be undone.
          </Typography>
        </Stack>
      ) : isConfirmationScreen ? (
        <ConfirmationScreen
          control={control}
          description={description}
          errors={errors}
          handleConfirmationSubmit={handleConfirmationSubmit}
          handleGenerateDescription={handleGenerateDescription}
          isConfirmed={isConfirmed}
          isEditingAiResponse={isEditingAiResponse}
          isPendingCreateStrategyDescription={
            isPendingCreateStrategyDescription
          }
          isSuccess={isSuccess}
          name={name}
          prompt_description={promptDescription}
          setIsEditingAiResponse={setIsEditingAiResponse}
          touchedFields={touchedFields}
        />
      ) : (
        <DescriptionTextField
          control={control}
          description={description}
          errors={errors}
          touchedFields={touchedFields}
        />
      )}
    </CustomModalWithSubmit>
  )
}

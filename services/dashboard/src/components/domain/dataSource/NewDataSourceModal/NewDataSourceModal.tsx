import { DataSourceOrigin, FileType } from '@zunou-graphql/core/graphql'
import { useCreateDataSourceMutation } from '@zunou-queries/core/hooks/useCreateDataSourceMutation'
import {
  FileUploadField,
  FormSection,
  TextField,
} from '@zunou-react/components/form'
import { getDataSourceType } from '@zunou-react/services/File'
import { useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { zodResolver } from '~/libs/zod'
import {
  CreateDataSourceParams,
  createDataSourceSchema,
} from '~/schemas/CreateDataSourceSchema'

interface Props {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  pulseId?: string
}

export const NewDataSourceModal = ({
  isOpen,
  onClose,
  organizationId,
  pulseId,
}: Props) => {
  const {
    isPending: isCreateDataSourcePending,
    mutateAsync: createDataSource,
  } = useCreateDataSourceMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    control,
    formState: { isValid, errors, touchedFields },
    handleSubmit,
    reset,
    setValue,
    trigger,
  } = useForm<CreateDataSourceParams>({
    defaultValues: {
      description: '',
      fileKey: '',
      name: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(createDataSourceSchema),
  })

  const { description, name, fileKey } = useWatch({ control })

  const isFormValid = isValid && !!name && !!description && !!fileKey

  const handleFileUploadChange = useCallback(
    async (value: string) => {
      setValue('fileKey', value)
      await trigger(['fileKey', 'name', 'description'])
    },
    [setValue, trigger],
  )

  const handleCreateDataSource = useCallback(
    async (data: CreateDataSourceParams) => {
      if (!pulseId) throw new Error('Pulse ID is missing')

      const extension = data?.fileKey?.split('.')?.pop() ?? 'txt'
      const type = getDataSourceType(extension)

      try {
        await createDataSource({
          ...data,
          organizationId,
          origin: DataSourceOrigin.Custom,
          pulseId: pulseId ?? '',
          type,
        })

        handleClose()
      } catch (error) {
        toast.error('Error creating new Data Source')
        console.error(error)
        handleClose()
      }
    },
    [organizationId, pulseId],
  )

  const handleClose = () => {
    onClose()
    reset()
  }

  const onSubmitHandler = handleSubmit((data: CreateDataSourceParams) => {
    handleCreateDataSource(data)
  })

  return (
    <CustomModalWithSubmit
      disabledSubmit={!isFormValid}
      isOpen={isOpen}
      isSubmitting={isCreateDataSourcePending}
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={onSubmitHandler}
      submitText="Upload Data"
      title="Add Data"
    >
      <FormSection
        sx={{
          '& .MuiDivider-root': {
            display: 'none',
          },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
        }}
      >
        <TextField
          control={control}
          error={touchedFields.name ? errors?.name : undefined}
          label="Name"
          name="name"
          value={name}
        />
        <TextField
          control={control}
          error={touchedFields.description ? errors?.description : undefined}
          label="Description"
          multiline={true}
          name="description"
          onChangeFilter={(val: string | undefined) => (val ? val : undefined)}
          rows={4}
          value={description}
        />
        <FileUploadField<CreateDataSourceParams>
          allowedFileTypes={[
            `.${(FileType.Csv, FileType.Doc, FileType.Docx, FileType.Html, FileType.Markdown, FileType.Pdf, FileType.Ppt, FileType.Pptx, FileType.Rtf, FileType.Txt, FileType.Xls, FileType.Xlsx)}`,
          ]}
          companionUrl={import.meta.env.VITE_COMPANION_URL}
          control={control}
          coreGraphQLUrl={import.meta.env.VITE_CORE_GRAPHQL_URL}
          error={errors?.fileKey}
          label="CSV, Doc, Docx, html, markdown, pdf, ppt, pptx, rtx, txt, xls, xlsx"
          name="fileKey"
          onChange={handleFileUploadChange}
          organizationId={organizationId}
        />
      </FormSection>
    </CustomModalWithSubmit>
  )
}

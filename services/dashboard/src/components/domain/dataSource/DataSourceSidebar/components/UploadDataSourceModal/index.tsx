import { DataSourceOrigin, FileType } from '@zunou-graphql/core/graphql'
import { useCreateDataSourceMutation } from '@zunou-queries/core/hooks/useCreateDataSourceMutation'
import {
  FileUploadField,
  FormSection,
  TextField,
} from '@zunou-react/components/form'
import { getDataSourceType } from '@zunou-react/services/File'
import { useCallback, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

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

export const UploadDataSourceModal = ({
  isOpen,
  onClose,
  organizationId,
  pulseId,
}: Props) => {
  const { t } = useTranslation(['common', 'sources'])
  const {
    mutateAsync: createDataSource,
    isPending: isPendingCreateDatasource,
  } = useCreateDataSourceMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    control,
    formState: { isValid, errors },
    handleSubmit,
    setValue,
    trigger,
    getValues,
    reset,
  } = useForm<CreateDataSourceParams>({
    mode: 'onBlur',
    resolver: zodResolver(createDataSourceSchema),
  })

  const { description, name } = useWatch({ control })

  const [isUploading, setIsUploading] = useState(false)

  const handleFileUploadChange = useCallback(
    (
      value: string,
      originalFileName?: string,
      uploadState?: { isUploading: boolean },
    ) => {
      setValue('fileKey', value)
      trigger('fileKey')
      setIsUploading(uploadState?.isUploading ?? false)

      const currentName = getValues('name')
      if (originalFileName && !currentName?.trim()) {
        const cleanFileName = originalFileName.split('.')[0]
        setValue('name', cleanFileName)
        trigger('name')
      }
    },
    [setValue, trigger, getValues],
  )

  const handleCreateDataSource = useCallback(
    async (data: CreateDataSourceParams) => {
      if (isPendingCreateDatasource) return

      const extension = data?.fileKey?.split('.')?.pop() ?? 'txt'
      const type = getDataSourceType(extension)
      const fileName = `${data?.name}.${extension}`

      try {
        if (!pulseId) throw new Error('Pulse ID is missing')

        await createDataSource({
          ...data,
          fileName: fileName,
          organizationId,
          origin: DataSourceOrigin.Custom,
          pulseId: pulseId ?? '',
          type,
        })

        handleClose()
      } catch (error) {
        toast.error(t('create_source_error', { ns: 'sources' }))
        console.error(error)
        handleClose()
      }
    },
    [organizationId, pulseId, isPendingCreateDatasource, t],
  )

  const handleClose = () => {
    onClose()
    reset()
    setIsUploading(false)
  }

  const onSubmitHandler = handleSubmit((data: CreateDataSourceParams) => {
    handleCreateDataSource(data)
  })

  return (
    <CustomModalWithSubmit
      disabledSubmit={!isValid || isUploading || isPendingCreateDatasource}
      isOpen={isOpen}
      isSubmitting={isPendingCreateDatasource}
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={onSubmitHandler}
      subheader={t('upload_file_description', { ns: 'sources' })}
      submitText={
        isUploading
          ? `${t('uploading', { ns: 'sources' })}...`
          : t('upload', { ns: 'sources' })
      }
      title={t('select_files', { ns: 'sources' })}
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
          error={errors?.name}
          label={t('name')}
          name="name"
          value={name}
        />
        <TextField
          control={control}
          error={errors?.description}
          label={t('description')}
          multiline={true}
          name="description"
          onChangeFilter={(val: string | undefined) => (val ? val : undefined)}
          rows={4}
          value={description}
        />
        <FileUploadField<CreateDataSourceParams>
          allowedFileTypes={[
            `.${FileType.Csv}`,
            `.${FileType.Doc}`,
            `.${FileType.Docx}`,
            `.${FileType.Html}`,
            `.${FileType.Markdown}`,
            `.${FileType.Pdf}`,
            `.${FileType.Ppt}`,
            `.${FileType.Pptx}`,
            `.${FileType.Rtf}`,
            `.${FileType.Txt}`,
            `.${FileType.Xls}`,
            `.${FileType.Xlsx}`,
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

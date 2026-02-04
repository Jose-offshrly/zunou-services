import { Stack, Typography } from '@mui/material'
import { DataSourceOrigin, FileType } from '@zunou-graphql/core/graphql'
import { useCreateDataSourceMutation } from '@zunou-queries/core/hooks/useCreateDataSourceMutation'
import {
  FileUploadField,
  FormSection,
  LoadingButton,
  TextField,
} from '@zunou-react/components/form'
import { getDataSourceType } from '@zunou-react/services/File'
import { useCallback, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { zodResolver } from '~/libs/zod'
import {
  CreateDataSourceParams,
  createDataSourceSchema,
} from '~/schemas/CreateDataSourceSchema'

interface Props {
  organizationId: string
  pulseId?: string
  onClose: () => void
}

export const ContentTab = ({ organizationId, pulseId, onClose }: Props) => {
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

        onClose()
      } catch (error) {
        toast.error(t('create_source_error', { ns: 'sources' }))
        console.error(error)
        onClose()
      }
    },
    [organizationId, pulseId],
  )

  const onSubmitHandler = handleSubmit((data: CreateDataSourceParams) => {
    handleCreateDataSource(data)
  })

  return (
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
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Stack alignItems="start" justifyContent="start">
          <Typography color="text.primary" fontSize={21} fontWeight={600}>
            {t('select_files', { ns: 'sources' })}
          </Typography>
          <Typography color="text.secondary" fontSize={14} fontWeight={400}>
            {t('upload_file_description', { ns: 'sources' })}
          </Typography>
        </Stack>
        <LoadingButton
          disabled={!isValid || isUploading || isPendingCreateDatasource}
          loading={isPendingCreateDatasource}
          onClick={onSubmitHandler}
          size="large"
          variant="contained"
        >
          {isUploading
            ? `${t('uploading', { ns: 'sources' })}...`
            : t('upload', { ns: 'sources' })}
        </LoadingButton>
      </Stack>
      <>
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
      </>
    </FormSection>
  )
}

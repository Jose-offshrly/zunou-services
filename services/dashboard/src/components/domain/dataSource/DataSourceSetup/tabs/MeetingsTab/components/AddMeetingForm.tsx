import { ArrowBackIos } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { FileType } from '@zunou-graphql/core/graphql'
import { useCreateMeetingMutation } from '@zunou-queries/core/hooks/useCreateMeetingMutation'
import {
  Button,
  FileUploadField,
  FormSection,
  LoadingButton,
  TextField,
} from '@zunou-react/components/form'
import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { zodResolver } from '~/libs/zod'
import {
  CreateMeetingParams,
  createMeetingSchema,
} from '~/schemas/CreateMeetingSchema'

interface AddMeetingFormProps {
  setAddMeetingMode: (val: boolean) => void
}

const AddMeetingForm = ({ setAddMeetingMode }: AddMeetingFormProps) => {
  const { mutateAsync: createMeeting, isPending: isPendingCreateMeeting } =
    useCreateMeetingMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()

  const {
    control,
    formState: { isValid, errors },
    handleSubmit,
    setValue,
    trigger,
    getValues,
    clearErrors,
  } = useForm<CreateMeetingParams>({
    mode: 'onBlur',
    resolver: zodResolver(createMeetingSchema),
  })

  useEffect(() => {
    if (pulseId) {
      setValue('pulseId', pulseId)
      trigger('pulseId')
    }
  }, [pulseId])

  const { participants, title, transcript, metadata } = useWatch({ control })

  const [isUploading, setIsUploading] = useState(false)

  const handleFileUploadChange = useCallback(
    (
      value: string,
      originalFileName?: string,
      uploadState?: { isUploading: boolean },
    ) => {
      setValue('metadata.fileKey', value)
      trigger('metadata.fileKey')

      setValue('transcript', undefined)
      clearErrors('transcript')

      setIsUploading(uploadState?.isUploading ?? false)

      const currentName = getValues('metadata.fileName')
      if (originalFileName && !currentName?.trim()) {
        const cleanFileName = originalFileName.split('.')[0]
        setValue('metadata.fileName', cleanFileName)
        trigger('metadata.fileName')
      }
    },
    [setValue, trigger, getValues],
  )

  const handleCreateMeeting = useCallback(
    async (data: CreateMeetingParams) => {
      try {
        if (isPendingCreateMeeting) return

        await createMeeting({
          metadata: data.metadata,
          participants: data.participants,
          pulseId: data.pulseId,
          title: data.title,
          transcript: data.transcript ?? null,
        })

        toast.success('Successfully added meeting!')
        setAddMeetingMode(false)
      } catch (error) {
        toast.error('Error adding meeting.')
        console.error(error)
      }
    },
    [organizationId, setAddMeetingMode, isPendingCreateMeeting, createMeeting],
  )

  const onSubmitHandler = handleSubmit((data: CreateMeetingParams) => {
    handleCreateMeeting(data)
  })

  return (
    <FormSection
      sx={{
        '& .MuiDivider-root': {
          display: 'none',
        },
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width: '100%',
      }}
    >
      <Stack alignItems="start" justifyContent="center">
        <Button
          disableRipple={true}
          onClick={() => setAddMeetingMode(false)}
          sx={{
            '&:hover': {
              backgroundColor: 'transparent',
            },
            display: 'inline-flex',
            minWidth: 'auto',
            px: 0,
            width: 'auto',
          }}
          variant="text"
        >
          <ArrowBackIos sx={{ color: 'text.secondary', fontSize: 12 }} />
          <Typography color="text.secondary" fontSize="small">
            Back
          </Typography>
        </Button>

        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          width="100%"
        >
          <Stack alignItems="start" justifyContent="center">
            <Typography color="text.primary" fontSize={21} fontWeight={600}>
              Add Meeting
            </Typography>
            <Typography color="text.secondary" fontSize={14} fontWeight={400}>
              Upload meeting notes or transcripts
            </Typography>
          </Stack>

          <LoadingButton
            disabled={!isValid || isUploading || isPendingCreateMeeting}
            loading={isPendingCreateMeeting}
            onClick={onSubmitHandler}
            size="large"
            variant="contained"
          >
            Add
          </LoadingButton>
        </Stack>
      </Stack>

      <Stack gap={2}>
        <TextField
          control={control}
          error={errors?.title}
          label="Title"
          name="title"
          value={title}
        />

        <TextField
          control={control}
          error={errors?.participants}
          label="Participants"
          name="participants"
          value={participants}
        />

        <TextField
          control={control}
          disabled={!!metadata?.fileKey || !!metadata?.fileName}
          error={errors?.transcript}
          label="Transcript"
          multiline={true}
          name="transcript"
          onChangeFilter={(val: string | undefined) => (val ? val : undefined)}
          rows={4}
          value={transcript}
        />

        <FileUploadField<CreateMeetingParams>
          allowedFileTypes={[
            // BE Endpoint only supports txt file for now.
            // `.${(FileType.Csv, FileType.Doc, FileType.Docx, FileType.Html, FileType.Markdown, FileType.Pdf, FileType.Ppt, FileType.Pptx, FileType.Rtf, FileType.Txt, FileType.Xls, FileType.Xlsx)}`,
            `.${FileType.Txt}`,
          ]}
          companionUrl={import.meta.env.VITE_COMPANION_URL}
          control={control}
          coreGraphQLUrl={import.meta.env.VITE_CORE_GRAPHQL_URL}
          error={errors?.metadata?.fileKey}
          label="Upload meeting file (txt)"
          name="fileKey"
          onChange={handleFileUploadChange}
          organizationId={organizationId}
        />
      </Stack>
    </FormSection>
  )
}

export default AddMeetingForm

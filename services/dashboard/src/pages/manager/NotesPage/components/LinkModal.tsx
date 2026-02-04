import { Stack } from '@mui/material'
import { TextField } from '@zunou-react/components/form/TextField'
import { useForm } from 'react-hook-form'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { z, zodResolver } from '~/libs/zod'

const linkFormSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  url: z.string().url('Please enter a valid URL'),
})

type LinkFormData = z.infer<typeof linkFormSchema>

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LinkFormData) => void
}

export const LinkModal = ({ isOpen, onClose, onSubmit }: LinkModalProps) => {
  const {
    handleSubmit,
    reset,
    formState: { isValid },
    control,
    watch,
  } = useForm<LinkFormData>({
    defaultValues: {
      text: '',
      url: '',
    },
    mode: 'onChange',
    resolver: zodResolver(linkFormSchema),
  })

  const textValue = watch('text')
  const urlValue = watch('url')

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmitHandler = handleSubmit((data: LinkFormData) => {
    onSubmit(data)
    reset()
    onClose()
  })

  return (
    <CustomModalWithSubmit
      disabledSubmit={!isValid}
      isOpen={isOpen}
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={onSubmitHandler}
      submitText="Add Link"
      title="Add Link"
    >
      <Stack spacing={2}>
        <TextField
          control={control}
          fullWidth={true}
          label="Text"
          name="text"
          placeholder="Enter the text to display"
          required={true}
          size="small"
          value={textValue}
        />
        <TextField
          control={control}
          fullWidth={true}
          label="URL"
          name="url"
          placeholder="https://example.com"
          required={true}
          size="small"
          value={urlValue}
        />
      </Stack>
    </CustomModalWithSubmit>
  )
}

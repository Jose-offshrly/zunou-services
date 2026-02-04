import { Stack } from '@mui/material'
import { TextField } from '@zunou-react/components/form'
import { useForm, useWatch } from 'react-hook-form'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { zodResolver } from '~/libs/zod'
import {
  CustomPulseFormParams,
  customPulseFormSchema,
} from '~/schemas/CustomPulseSchema'

interface CreateCustomPulseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CustomPulseFormParams) => void
}

const initialFormState = {
  description: '',
  name: '',
  type: undefined,
}

export const CreateCustomPulseModal = ({
  isOpen,
  onClose,
  onSubmit,
}: CreateCustomPulseModalProps) => {
  const { handleSubmit, reset, control } = useForm<CustomPulseFormParams>({
    defaultValues: initialFormState,
    mode: 'onChange',
    resolver: zodResolver(customPulseFormSchema),
  })

  const { description, name } = useWatch({ control })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmitHandler = handleSubmit((data: CustomPulseFormParams) => {
    onSubmit(data)

    reset()
    onClose()
  })

  return (
    <CustomModalWithSubmit
      isOpen={isOpen}
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={onSubmitHandler}
      submitText="Add Pulse"
      title="Add Pulse"
    >
      <Stack spacing={1}>
        <TextField
          control={control}
          id="name"
          name="name"
          placeholder="Pulse Name"
          required={true}
          size="small"
          value={name}
        />
        <TextField
          control={control}
          id="description"
          multiline={true}
          name="description"
          placeholder="Description"
          rows={4}
          size="small"
          value={description}
        />
      </Stack>
    </CustomModalWithSubmit>
  )
}

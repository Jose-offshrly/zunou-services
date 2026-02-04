import { Stack } from '@mui/material'
import { TextField } from '@zunou-react/components/form'
import { Control, FieldErrors, FormState } from 'react-hook-form'

import { StrategyFormData } from '~/schemas/StrategiesSchema'

export interface DescriptionTextFieldProps {
  control: Control<StrategyFormData>
  touchedFields: FormState<StrategyFormData>['touchedFields']
  errors: FieldErrors<StrategyFormData>
  description: string | undefined
}

export const DescriptionTextField = ({
  control,
  touchedFields,
  errors,
  description,
}: DescriptionTextFieldProps) => (
  <Stack spacing={2}>
    <TextField
      control={control}
      error={touchedFields.description ? errors?.description : undefined}
      fullWidth={true}
      label="Description"
      minRows={5}
      multiline={true}
      name="description"
      size="small"
      value={description}
    />
  </Stack>
)

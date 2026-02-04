import { Typography } from '@mui/material'
import { DataSource } from '@zunou-graphql/core/graphql'
import { ReactQuillTextField } from '@zunou-react/components/form/ReactQuillTextField'
import { Control, FieldErrors, FormState } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { NoDataText } from '~/components/ui/NoDataText'
import { UpdateDataSourceParams } from '~/schemas/UpdateDataSourceSchema'

interface TextFieldSectionProps {
  control: Control<UpdateDataSourceParams>
  dataSource?: DataSource
  errors: FieldErrors<UpdateDataSourceParams>
  fieldName: 'description' | 'summary'
  isEditing: boolean
  isLoading: boolean
  rowCount?: number
  touchedFields: FormState<UpdateDataSourceParams>['touchedFields']
  value?: string | null
}

export const TextFieldSection = ({
  control,
  dataSource,
  errors,
  fieldName,
  isEditing,
  isLoading,
  rowCount = 2,
  touchedFields,
  value,
}: TextFieldSectionProps) => {
  const { t } = useTranslation()

  if (isEditing) {
    return (
      <ReactQuillTextField
        control={control}
        error={touchedFields[fieldName] ? errors?.[fieldName] : undefined}
        id={fieldName}
        multiline={true}
        name={fieldName}
        rows={rowCount}
        value={value}
      />
    )
  }

  if (isLoading) {
    return <LoadingSkeleton height={56} />
  }

  if (dataSource?.[fieldName]) {
    // Render HTML with formatting (from ReactQuill)
    return (
      <Typography
        color="text.secondary"
        component="div"
        dangerouslySetInnerHTML={{ __html: dataSource[fieldName]! }}
        fontSize={14}
        fontWeight="400"
        sx={{ wordBreak: 'break-word' }}
      />
    )
  }

  return <NoDataText text={t('no_data')} />
}

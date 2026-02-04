import { Check, Close } from '@mui/icons-material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Icon, Stack, TableCell, TableRow } from '@mui/material'
import { Box } from '@mui/system'
import { IconButton } from '@zunou-react/components/form'
import { truncate } from 'lodash'
import { ChangeEvent, ReactNode, useState } from 'react'
import { FieldValues, UseFormReset } from 'react-hook-form'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

interface EditableTableRowProps<T extends FieldValues> {
  editComponent?: ReactNode
  isLoading?: boolean
  label: string
  onSubmit: () => void
  reset: UseFormReset<T>
  value?: string | null | ReactNode
  isValid?: boolean
  onUpload?: (event: ChangeEvent<HTMLInputElement>) => void
}

export const EditableTableRow = <T extends FieldValues>({
  editComponent,
  isLoading,
  label,
  onSubmit,
  reset,
  value,
  isValid = true,
  onUpload,
}: EditableTableRowProps<T>) => {
  const [isEditing, setIsEditing] = useState(false)

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  const handleSubmit = () => {
    onSubmit()
    setIsEditing(false)
  }

  return (
    <TableRow>
      <TableCell sx={{ alignContent: 'flex-start' }}>{label}</TableCell>
      <TableCell>
        {isLoading ? (
          <LoadingSkeleton height={24} />
        ) : (
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            spacing={2}
          >
            {isEditing ? (
              <>
                {editComponent}
                <Stack direction="row" spacing={1}>
                  <IconButton
                    disabled={!isValid}
                    onClick={handleSubmit}
                    type="submit"
                  >
                    <Icon component={Check} fontSize="small" />
                  </IconButton>
                  <IconButton onClick={handleCancel}>
                    <Icon component={Close} fontSize="small" />
                  </IconButton>
                </Stack>
              </>
            ) : (
              <>
                <Box>
                  {typeof value === 'string'
                    ? truncate(value, { length: 40 })
                    : value == null
                      ? 'N/A'
                      : value}
                </Box>

                {onUpload ? (
                  <IconButton component="label" size="small">
                    <input
                      accept="image/*"
                      hidden={true}
                      onChange={onUpload}
                      type="file"
                    />
                    <Icon component={EditOutlinedIcon} fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => setIsEditing(true)} size="small">
                    <Icon component={EditOutlinedIcon} fontSize="small" />
                  </IconButton>
                )}
              </>
            )}
          </Stack>
        )}
      </TableCell>
    </TableRow>
  )
}

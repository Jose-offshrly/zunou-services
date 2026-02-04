import { EditOutlined } from '@mui/icons-material'
import { Avatar, Button, Divider, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { theme } from '@zunou-react/services/Theme'

import pulseLogo from '~/assets/pulse-logo.png'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { StrategyFormData } from '~/schemas/StrategiesSchema'

import {
  DescriptionTextField,
  DescriptionTextFieldProps,
} from './DescriptionTextField'

interface ConfirmationScreenProps extends DescriptionTextFieldProps {
  name: string | undefined
  isEditingAiResponse: boolean
  setIsEditingAiResponse: (value: boolean) => void
  isPendingCreateStrategyDescription: boolean
  handleGenerateDescription: (data: StrategyFormData) => void
  handleConfirmationSubmit: () => void
  isSuccess: boolean
  prompt_description?: string
  isConfirmed: boolean
}

export const ConfirmationScreen = ({
  control,
  touchedFields,
  errors,
  description,
  name,
  isEditingAiResponse,
  setIsEditingAiResponse,
  isPendingCreateStrategyDescription,
  handleGenerateDescription,
  handleConfirmationSubmit,
  isSuccess,
  isConfirmed,
}: ConfirmationScreenProps) => (
  <Stack spacing={2}>
    <Stack alignItems="center" direction="row" justifyContent="space-between">
      <Typography fontWeight="bold">AI Generated Description</Typography>
      {isEditingAiResponse && description && name ? (
        <Stack direction="row" spacing={1}>
          <Button
            onClick={() => {
              handleGenerateDescription({
                description: description,
                name: name,
              })
              setIsEditingAiResponse(false)
            }}
            sx={{
              textTransform: 'none',
            }}
            variant="contained"
          >
            Save
          </Button>
          <Button
            onClick={() => setIsEditingAiResponse(false)}
            sx={{
              color: 'primary.main',
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
        </Stack>
      ) : (
        <Button
          onClick={() => setIsEditingAiResponse(true)}
          startIcon={<EditOutlined />}
          sx={{ textTransform: 'none' }}
        >
          Edit
        </Button>
      )}
    </Stack>
    {isEditingAiResponse ? (
      <Stack spacing={2}>
        <DescriptionTextField
          control={control}
          description={description}
          errors={errors}
          touchedFields={touchedFields}
        />
      </Stack>
    ) : (
      <Stack alignItems="flex-start" direction="row" spacing={1}>
        <Avatar
          alt="assistant"
          src={pulseLogo}
          sx={{ height: 32, width: 32 }}
        />
        <Stack
          sx={{
            bgcolor:
              isPendingCreateStrategyDescription || isSuccess
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.error.main, 0.1),
            border:
              isSuccess || isPendingCreateStrategyDescription
                ? 'none'
                : `1px solid ${theme.palette.error.main}`,
            borderRadius: '0px 16px 16px 16px',
            maxWidth: '90%',
            minWidth: '80%',
            p: 2,
          }}
        >
          {isPendingCreateStrategyDescription ? (
            <Stack spacing={1}>
              <LoadingSkeleton height={20} width="80%" />
              <LoadingSkeleton height={20} width="90%" />
              <LoadingSkeleton height={20} width="70%" />
            </Stack>
          ) : !isSuccess ? (
            <Stack>
              <Typography fontWeight="bold">Error in Generating:</Typography>
              <Typography>{description}</Typography>
            </Stack>
          ) : (
            <Typography>{description}</Typography>
          )}
        </Stack>
      </Stack>
    )}

    <Divider
      sx={{
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        width: '100%',
      }}
    />
    <Typography align="center" paddingX={10} variant="body2">
      {
        "We've generated a refined description tailored based on your input. Does it align with your goals?"
      }
    </Typography>
    <Stack direction="row" justifyContent="center">
      <Button
        color="primary"
        disabled={
          !isSuccess ||
          isPendingCreateStrategyDescription ||
          isEditingAiResponse ||
          isConfirmed
        }
        onClick={handleConfirmationSubmit}
        sx={{
          '&.Mui-disabled': {
            backgroundColor: 'action.disabledBackground',
            borderColor: 'action.disabledBackground',
            color: 'text.disabled',
          },
          textTransform: 'none',
        }}
        variant="contained"
      >
        Looks Good - Add It
      </Button>
    </Stack>
  </Stack>
)

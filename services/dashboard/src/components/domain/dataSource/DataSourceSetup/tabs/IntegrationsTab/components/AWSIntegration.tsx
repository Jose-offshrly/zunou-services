import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircleOutlined, ChevronLeft } from '@mui/icons-material'
import {
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  lighten,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CreateIntegrationInput } from '@zunou-graphql/core/graphql'
import { useCreateIntegrationMutation } from '@zunou-queries/core/hooks/useCreateIntegrationMutation'
import { useGetIntegration } from '@zunou-queries/core/hooks/useGetIntegration'
import { LoadingButton } from '@zunou-react/components/form/LoadingButton'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import {
  UpdateAWSIntegrationParams,
  updateAWSIntegrationSchema,
} from '~/schemas/UpdateAWSIntegrationSchema'

interface AWSIntegrationProps {
  handleBack: () => void
  icon: string
}

export const AWSIntegration = ({ handleBack, icon }: AWSIntegrationProps) => {
  const { t } = useTranslation(['common', ' sources'])
  const { pulseId } = useParams()
  const { user } = useAuthContext()

  const { data: awsIntegrationData, isFetching: isFetchingAWSIntegration } =
    useGetIntegration({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        pulseId: pulseId,
        type: 'aws',
        userId: user?.id,
      },
    })
  const AWSIntegration = awsIntegrationData?.integration

  const {
    control,
    handleSubmit,
    formState: { isSubmitted, isValid },
  } = useForm<UpdateAWSIntegrationParams>({
    defaultValues: {
      apiKey: '',
      secretKey: '',
    },
    mode: 'onChange',
    resolver: zodResolver(updateAWSIntegrationSchema),
  })

  const { mutateAsync: integrateAWS, isPending } = useCreateIntegrationMutation(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    },
  )

  const onSubmit = async ({
    apiKey,
    secretKey,
  }: UpdateAWSIntegrationParams) => {
    if (!pulseId) return

    try {
      const input = {
        api_key: apiKey,
        pulse_id: pulseId,
        secret_key: secretKey,
        type: 'aws',
      } satisfies CreateIntegrationInput

      await integrateAWS(input)

      toast.success('Successfully connected to AWS!')
    } catch {
      toast.error('Failed to connect to AWS. Please try again.')
    }
  }

  return (
    <Stack alignItems="center" justifyContent="center" spacing={3} width="100%">
      <Stack alignItems="start" spacing={1} width="100%">
        <Typography fontWeight="bold" variant="h6">
          {t('add_aws_integration', { ns: 'sourecs' })}
        </Typography>
        <Stack alignItems="center" direction="row" spacing={1}>
          <IconButton
            onClick={handleBack}
            sx={{
              '&:hover': { backgroundColor: 'transparent' },
              alignItems: 'center',
              display: 'flex',
              p: 0,
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Typography
            fontSize={14}
            onClick={handleBack}
            sx={{ cursor: 'pointer', ml: 1 }}
          >
            {t('back')}
          </Typography>
        </Stack>
      </Stack>

      <Stack
        alignItems="center"
        border={1}
        borderColor={lighten(theme.palette.primary.main, 0.9)}
        borderRadius={1}
        justifyContent="center"
        p={3}
        width="100%"
      >
        <Stack alignItems="center" spacing={3} width="100%">
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="center"
            spacing={1}
          >
            <img alt="aws.com" height={40} src={icon} width={40} />
          </Stack>

          <Divider sx={{ width: '100%' }} />
          {isFetchingAWSIntegration ? (
            <LoadingSpinner />
          ) : isSubmitted ? (
            <Stack alignItems="center" justifyContent="center" spacing={1}>
              <CheckCircleOutlined
                sx={{ color: 'primary.main', fontSize: 40 }}
              />
              <Typography fontSize={20} fontWeight={500}>
                {t('aws_connected', { ns: 'sources' })}
              </Typography>
            </Stack>
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={3}
              width="100%"
            >
              {!!AWSIntegration && (
                <Stack width="100%">
                  <FormLabel
                    component="label"
                    sx={{ fontSize: 16, fontWeight: 500, marginBottom: 1 }}
                  >
                    {t('current_aws_key', { ns: 'sources' })}
                  </FormLabel>
                  <TextField
                    disabled={true}
                    size="small"
                    value={AWSIntegration?.api_key}
                  />
                </Stack>
              )}
              <FormControl
                sx={{
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  width: '100%',
                }}
              >
                <FormLabel
                  component="label"
                  sx={{ fontSize: 16, fontWeight: 500, marginBottom: 1 }}
                >
                  {t('aws_key', { ns: 'sources' })}
                </FormLabel>
                <Controller
                  control={control}
                  name="apiKey"
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      onChange={onChange}
                      value={value}
                      {...field}
                      fullWidth={true}
                      placeholder={t('aws_key_placeholder', { ns: 'sources' })}
                      required={true}
                      size="small"
                      variant="outlined"
                    />
                  )}
                />
              </FormControl>
              <FormControl
                sx={{
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  width: '100%',
                }}
              >
                <FormLabel
                  component="label"
                  sx={{ fontSize: 16, fontWeight: 500, marginBottom: 1 }}
                >
                  {t('aws_secret_key', { ns: 'sources' })}
                </FormLabel>
                <Controller
                  control={control}
                  name="secretKey"
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      onChange={onChange}
                      value={value}
                      {...field}
                      fullWidth={true}
                      placeholder={t('aws_secret_key_placeholder', {
                        ns: 'sources',
                      })}
                      required={true}
                      size="small"
                      type="password"
                      variant="outlined"
                    />
                  )}
                />
              </FormControl>
              <LoadingButton
                color="primary"
                disabled={isPending || !isValid}
                loading={isPending}
                onClick={handleSubmit(onSubmit)}
                size="large"
                variant="contained"
              >
                {t('confirm')}
              </LoadingButton>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}

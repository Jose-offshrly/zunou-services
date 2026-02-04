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
import { useCreateIntegrationMutation } from '@zunou-queries/core/hooks/useCreateIntegrationMutation'
import { useGetIntegration } from '@zunou-queries/core/hooks/useGetIntegration'
import { LoadingButton } from '@zunou-react/components/form/LoadingButton'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import {
  UpdateIntegrationParams,
  updateIntegrationSchema,
} from '~/schemas/UpdateIntegrationSchema'

interface FirefliesIntegrationProps {
  handleBack: () => void
  icon: string
}

export const FirefliesIntegration = ({
  handleBack,
  icon,
}: FirefliesIntegrationProps) => {
  const { t } = useTranslation(['common', 'sources'])
  const { pulseId } = useParams()
  const { user } = useAuthContext()

  const [isSubmitted, setSubmitted] = useState(false)

  const {
    data: firefliesIntegrationData,
    isFetching: isFetchingFirefliesIntegration,
  } = useGetIntegration({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId: pulseId,
      type: 'fireflies',
      userId: user?.id,
    },
  })
  const firefliesIntegration = firefliesIntegrationData?.integration

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<UpdateIntegrationParams>({
    defaultValues: {
      apiKey: '',
    },
    mode: 'onChange',
    resolver: zodResolver(updateIntegrationSchema),
  })

  const { mutateAsync: integrateFireFlies, isPending } =
    useCreateIntegrationMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const onSubmit = async ({ apiKey }: UpdateIntegrationParams) => {
    if (!pulseId) return

    try {
      const response = await integrateFireFlies({
        api_key: apiKey,
        pulse_id: pulseId,
        type: 'fireflies',
      })

      if (!response.createIntegration)
        throw new Error('Failed to connect to Fireflies. Please try again.')

      setSubmitted(true)
      toast.success('Successfully connected to Fireflies!')
    } catch {
      setSubmitted(false)
      toast.error('Failed to connect to Fireflies. Please try again.')
    }
  }

  return (
    <Stack alignItems="center" justifyContent="center" spacing={3} width="100%">
      <Stack alignItems="start" spacing={1} width="100%">
        <Typography fontWeight="bold" variant="h6">
          {t('add_fireflies_inegration', { ns: 'sources' })}
        </Typography>
        <Stack alignItems="center" direction="row" spacing={1}>
          <IconButton
            onClick={handleBack}
            sx={{
              '&:hover': { backgroundColor: 'transparent' },
              p: 0,
            }}
          >
            <ChevronLeft fontSize="small" />
            <Typography fontSize={14}>{t('back')}</Typography>
          </IconButton>
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
            <img alt="fireflies.ai" height={40} src={icon} width={40} />
            <Typography fontSize={18} fontWeight={500}>
              fireflies.ai
            </Typography>
          </Stack>

          <Divider sx={{ width: '100%' }} />
          {isFetchingFirefliesIntegration ? (
            <LoadingSpinner />
          ) : isSubmitted ? (
            <Stack alignItems="center" justifyContent="center" spacing={1}>
              <CheckCircleOutlined
                sx={{ color: 'primary.main', fontSize: 40 }}
              />
              <Typography fontSize={20} fontWeight={500} textAlign="center">
                {t('fireflies_connected', { ns: 'sources' })}
              </Typography>
            </Stack>
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={3}
              width="100%"
            >
              {!!firefliesIntegration && (
                <Stack width="100%">
                  <FormLabel
                    component="label"
                    sx={{ fontSize: 16, fontWeight: 500, marginBottom: 1 }}
                  >
                    {t('current_api_key', { ns: 'sources' })}
                  </FormLabel>
                  <TextField
                    disabled={true}
                    size="small"
                    value={firefliesIntegration?.api_key}
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
                  {t('new_api_key', { ns: 'sources' })}
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
                      placeholder="Enter your API key"
                      required={true}
                      size="small"
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

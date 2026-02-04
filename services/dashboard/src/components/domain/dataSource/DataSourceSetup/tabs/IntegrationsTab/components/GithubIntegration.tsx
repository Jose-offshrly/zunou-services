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
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import {
  UpdateIntegrationParams,
  updateIntegrationSchema,
} from '~/schemas/UpdateIntegrationSchema'

interface GithubIntegrationProps {
  handleBack: () => void
  icon: string
}

export const GithubIntegration = ({
  handleBack,
  icon,
}: GithubIntegrationProps) => {
  const { t } = useTranslation(['common', 'sources'])
  const { pulseId } = useParams()
  const { user } = useAuthContext()

  const {
    data: githubIntegrationData,
    isFetching: isFetchingGithubIntegration,
  } = useGetIntegration({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId: pulseId,
      type: 'github',
      userId: user?.id,
    },
  })
  const githubIntegration = githubIntegrationData?.integration

  const {
    control,
    handleSubmit,
    formState: { isSubmitted, isValid },
  } = useForm<UpdateIntegrationParams>({
    defaultValues: {
      apiKey: '',
    },
    mode: 'onChange',
    resolver: zodResolver(updateIntegrationSchema),
  })

  const { mutateAsync: integrateGithub, isPending } =
    useCreateIntegrationMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const onSubmit = async ({ apiKey }: UpdateIntegrationParams) => {
    if (!pulseId) return

    try {
      await integrateGithub({
        api_key: apiKey,
        pulse_id: pulseId,
        type: 'github',
      })

      toast.success('Successfully connected to GitHub!')
    } catch {
      toast.error('Failed to connect to GitHub. Please try again.')
    }
  }

  return (
    <Stack alignItems="center" justifyContent="center" spacing={3} width="100%">
      <Stack alignItems="start" spacing={1} width="100%">
        <Typography fontWeight="bold" variant="h6">
          {t('add_github_inegration', { ns: 'sources' })}
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
            <img alt="github.com" height={40} src={icon} width={40} />
            <Typography fontSize={18} fontWeight={500}>
              github.com
            </Typography>
          </Stack>

          <Divider sx={{ width: '100%' }} />
          {isFetchingGithubIntegration ? (
            <LoadingSpinner />
          ) : isSubmitted ? (
            <Stack alignItems="center" justifyContent="center" spacing={1}>
              <CheckCircleOutlined
                sx={{ color: 'primary.main', fontSize: 40 }}
              />
              <Typography fontSize={20} fontWeight={500}>
                {t('github_connected', { ns: 'sources' })}
              </Typography>
            </Stack>
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={3}
              width="100%"
            >
              {!!githubIntegration && (
                <Stack width="100%">
                  <FormLabel
                    component="label"
                    sx={{ fontSize: 16, fontWeight: 500, marginBottom: 1 }}
                  >
                    {t('current_token', { ns: 'sources' })}
                  </FormLabel>
                  <TextField
                    disabled={true}
                    size="small"
                    value={githubIntegration?.api_key}
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
                  {t('github_token', { ns: 'sources' })}
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
                      placeholder={t('github_token_placeholder', {
                        ns: 'sources',
                      })}
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

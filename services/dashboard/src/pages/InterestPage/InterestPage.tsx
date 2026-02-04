import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowBack } from '@mui/icons-material'
import {
  Box,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCreateInterestMutation } from '@zunou-queries/core/hooks/useCreateInterestMutation'
import { Button, Form } from '@zunou-react/components/form'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import SuccessEmail from '~/assets/success-email.gif'
import { useReturnToLogin } from '~/hooks/useReturnToLogin'
import {
  RegisterInterestParams,
  registerInterestSchema,
} from '~/schemas/RegisterInterestSchema'

const companySizeOptions = [
  { label: '1 - 10 Employees', value: '1-10' },
  { label: '11 - 50 Employees', value: '11-50' },
  { label: '51 - 200 Employees', value: '51-200' },
  { label: '201 - 500 Employees', value: '201-500' },
  { label: '501 - 1,000 Employees', value: '501-1000' },
  { label: '1,001 - 5,000 Employees', value: '1001-5000' },
  { label: '5,001 - 10,000 Employees', value: '5001-10000' },
  { label: '10,000+ Employees', value: '10000+' },
]

export const InterestPage = () => {
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const { returnToLogin } = useReturnToLogin()

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
    setError,
  } = useForm<RegisterInterestParams>({
    defaultValues: {
      companySize: '1-10',
    },
    resolver: zodResolver(registerInterestSchema),
  })

  const { mutate: createInterest, isPending } = useCreateInterestMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleBack = returnToLogin

  const onSubmit = (data: RegisterInterestParams) => {
    createInterest(
      {
        company_name: data.companyName,
        company_size: data.companySize,
        email: data.email,
        looking_for: data.lookingFor,
        name: data.name,
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          const graphQLErrors = error.response?.errors

          if (graphQLErrors?.length) {
            const validation = graphQLErrors[0]?.extensions?.validation

            if (validation) {
              const emailError = validation['input.email']?.[0]

              if (emailError) {
                setError('email', {
                  message: 'This email is already taken',
                  type: 'server',
                })
                return
              }
            }
          }

          toast.error('Form submission failed.')
        },
        onSuccess: () => {
          setRegisterSuccess(true)
        },
      },
    )
  }

  return (
    <Stack
      direction={{ md: 'row', sm: 'column' }}
      gap={5}
      height="100vh"
      justifyContent={{ md: 'space-between', sm: 'start' }}
      p="5%"
      position="relative"
      width="100vw"
    >
      <Box
        bgcolor="primary.main"
        borderRadius="50%"
        position="absolute"
        sx={{
          aspectRatio: '1 / 1',
          backdropFilter: 'blur(50px)',
          bottom: '0%',
          filter: 'blur(50px)',
          opacity: 0.1,
          right: '0%',
        }}
        width="40%"
        zIndex={10}
      />

      <Stack
        alignItems="start"
        gap={{ md: 0, sm: 3 }}
        height="100%"
        position="relative"
        width={{ md: '40%', sm: '100%' }}
        zIndex={50}
      >
        <Button
          onClick={handleBack}
          startIcon={<ArrowBack />}
          sx={{ color: 'text.secondary' }}
        >
          Return to Log In
        </Button>
        <Stack flex={1} justifyContent="center">
          {registerSuccess ? (
            <Stack>
              <Typography fontWeight="bold" variant="h2">
                Thank you for your{' '}
                <Typography
                  color="primary"
                  component="span"
                  fontWeight="bold"
                  variant="h2"
                >
                  Interest!
                </Typography>
              </Typography>
              <Typography fontSize="1.2rem">
                We&apos;ve received your request and will be in touch shortly
              </Typography>
            </Stack>
          ) : (
            <Stack>
              <Typography fontWeight={700} variant="h2">
                Unlock the future with{' '}
                <Typography
                  color="primary.main"
                  component="span"
                  fontWeight={700}
                  variant="h2"
                >
                  Zunou
                </Typography>
              </Typography>

              <Typography fontSize="large">
                Sign up now to receive expert insights, AI advancements, and
                practical tips to enhance your productivity.
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>

      {registerSuccess ? (
        <Stack
          alignItems="center"
          flex={1}
          height="100%"
          justifyContent="center"
        >
          <img
            alt="success-email"
            src={SuccessEmail}
            style={{
              height: 'auto',
              maxHeight: 400,
              maxWidth: 400,
              width: '100%',
            }}
          />
        </Stack>
      ) : (
        <Stack
          bgcolor="common.white"
          border={1}
          borderColor="divider"
          borderRadius={5}
          height="100%"
          p={2}
          position="relative"
          width={{ md: '50%', sm: '100%' }}
          zIndex={50}
        >
          <Form
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              flex: 1,
              gap: 3,
              height: '100%',
              maxWidth: undefined,
              overflow: 'auto',
              width: '100%',
            }}
          >
            <Stack gap={0.5}>
              <FormLabel
                htmlFor="name"
                sx={{
                  fontWeight: 600,
                }}
              >
                Name
              </FormLabel>
              <TextField
                {...register('name')}
                id="name"
                name="name"
                placeholder="John Doe"
              />
            </Stack>

            <Stack gap={0.5}>
              <FormLabel
                htmlFor="name"
                sx={{
                  fontWeight: 600,
                }}
              >
                Email
              </FormLabel>
              <TextField
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                id="email"
                name="email"
                placeholder="johndoe@company.com"
              />
            </Stack>

            <Stack gap={0.5}>
              <FormLabel
                htmlFor="companyName"
                sx={{
                  fontWeight: 600,
                }}
              >
                Company Name
              </FormLabel>
              <TextField
                {...register('companyName')}
                id="companyName"
                name="companyName"
                placeholder="Company Name Inc."
              />
            </Stack>

            <Stack gap={0.5}>
              <FormLabel
                htmlFor="companySize"
                sx={{
                  fontWeight: 600,
                }}
              >
                Company Size
              </FormLabel>
              <FormControl>
                <Select defaultValue={'1-10'}>
                  {companySizeOptions.map(({ label, value }, index) => {
                    return (
                      <MenuItem key={index} value={value}>
                        {label}
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
            </Stack>

            <Stack gap={0.5}>
              <FormLabel
                htmlFor="name"
                sx={{
                  fontWeight: 600,
                }}
              >
                How are you looking to use Zunou?
              </FormLabel>
              <TextField
                {...register('lookingFor')}
                error={!!errors.lookingFor}
                helperText={errors.lookingFor?.message}
                id="details"
                multiline={true}
                name="lookingFor"
                placeholder="I need help with..."
                rows={4}
              />
            </Stack>
            <Button
              disabled={!isValid || isPending}
              size="large"
              type="submit"
              variant="contained"
            >
              Contact Us
            </Button>
          </Form>
        </Stack>
      )}
    </Stack>
  )
}

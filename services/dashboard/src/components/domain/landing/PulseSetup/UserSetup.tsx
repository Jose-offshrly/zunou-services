import { zodResolver } from '@hookform/resolvers/zod'
import { Box, FormLabel, Stack, Typography } from '@mui/material'
import { useGetOrganizationUserQuery } from '@zunou-queries/core/hooks/useGetOrganizationUserQuery'
import { useUpdateMeMutation } from '@zunou-queries/core/hooks/useUpdateMeMutation'
import { useUpdateOrganizationUserMutation } from '@zunou-queries/core/hooks/useUpdateOrganizationUserMutation'
import { Button, Form, TextField } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { PulseSetupLayout } from '~/components/layouts'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useLanguage } from '~/hooks/useLanguage'
import { useOrganization } from '~/hooks/useOrganization'

import FormContainer from '../FormContainer'
import LandingButton from '../LandingButton'

interface Props {
  currentStep: number
  totalSteps: number
  nextCallback?: () => void
}

const UserSetup = ({ currentStep, totalSteps, nextCallback }: Props) => {
  const { organizationId } = useOrganization()
  const { user, isLoading, refetchUser } = useAuthContext()

  const [submitting, setSubmitting] = useState(false)

  const { t } = useTranslation(['onboarding'])
  const { selectedLanguage, setLanguage } = useLanguage()

  // Create schema with localized error messages
  const schema = z.object({
    department: z
      .string()
      .min(1, t('departmentRequired', { ns: 'onboarding' })),
    jobTitle: z.string().min(1, t('titleRequired', { ns: 'onboarding' })),
    name: z.string().min(1, t('nameRequired', { ns: 'onboarding' })),
  })

  type FormValues = z.infer<typeof schema>

  const {
    data: organizationUserData,
    isLoading: isLoadingOrganizationUserData,
  } = useGetOrganizationUserQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      userId: user?.id,
    },
  })

  const orgUser = organizationUserData?.organizationUser

  const {
    control,
    reset,
    watch,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues: {
      department: '',
      jobTitle: '',
      name: '',
    },
    resolver: zodResolver(schema),
  })

  const { mutateAsync: updateOrganizationUser } =
    useUpdateOrganizationUserMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutateAsync: updateMe } = useUpdateMeMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  // watch values so we can pass them to inputs
  const name = watch('name')
  const jobTitle = watch('jobTitle')
  const department = watch('department')

  // Store original values for comparison
  const originalValues = {
    department: orgUser?.department ?? '',
    jobTitle: orgUser?.jobTitle ?? '',
    name: orgUser?.user?.name ?? '',
  }

  // update form when async data arrives
  useEffect(() => {
    if (orgUser) {
      reset({
        department: orgUser.department ?? '',
        jobTitle: orgUser.jobTitle ?? '',
        name: orgUser.user?.name ?? '',
      })
    }
  }, [orgUser, reset])

  const onSubmit = async (currentValues: FormValues) => {
    if (!orgUser?.id) return

    setSubmitting(true)

    const changedFields: Partial<FormValues> = {}

    // Check which fields have changed
    if (currentValues.name !== originalValues.name) {
      changedFields.name = currentValues.name
    }
    if (currentValues.jobTitle !== originalValues.jobTitle) {
      changedFields.jobTitle = currentValues.jobTitle
    }
    if (currentValues.department !== originalValues.department) {
      changedFields.department = currentValues.department
    }

    if ('name' in changedFields) {
      await updateMe({
        lastOrganizationId: organizationId,
        name: changedFields.name,
      })
      delete changedFields.name

      await refetchUser()
    }

    // Only update if there are changes
    if (Object.keys(changedFields).length > 0) {
      try {
        await updateOrganizationUser({
          organizationUserId: orgUser.id,
          ...changedFields,
        })
      } catch (error) {
        console.error('Error updating user:', error)
        return
      }
    }

    setSubmitting(false)

    nextCallback?.()
  }

  if (isLoading || isLoadingOrganizationUserData || !orgUser) {
    return (
      <Stack
        alignItems="center"
        height="100vh"
        justifyContent="center"
        width="100vw"
      >
        <LoadingSpinner />
      </Stack>
    )
  }

  return (
    <PulseSetupLayout>
      <Stack
        alignItems="center"
        direction="row"
        gap={5}
        height="100%"
        justifyContent="space-between"
        width="100%"
      >
        {/* Left Section */}
        <Stack alignItems="start" gap={2} width={{ lg: '35%', md: '100%' }}>
          <Typography
            color="primary.main"
            fontSize="small"
            textTransform="uppercase"
          >
            {t('step', { ns: 'onboarding' })} {currentStep}{' '}
            {t('of', { ns: 'onboarding' })} {totalSteps}
          </Typography>
          <Typography fontWeight={600} variant="h2">
            {t('tellMeMoreAbout', { ns: 'onboarding' })}{' '}
            <Box color="primary.main" component="span">
              {t('yourself', { ns: 'onboarding' })}
            </Box>
          </Typography>
          <Typography>{t('setupYourProfile', { ns: 'onboarding' })}</Typography>

          <Stack
            alignItems="center"
            direction="row"
            gap={2}
            justifyContent="space-between"
            width="100%"
          >
            <LandingButton
              disabled={submitting || !isValid}
              loading={submitting}
              onClick={handleSubmit(onSubmit)}
            >
              {t('next', { ns: 'onboarding' })}
            </LandingButton>
            <LandingButton
              disabled={submitting}
              onClick={() => nextCallback?.()}
              sx={{ color: 'text.secondary', fontWeight: 700 }}
              variant="text"
            >
              {t('skip', { ns: 'onboarding' })}
            </LandingButton>
          </Stack>
        </Stack>

        {/* Right Section - Form */}
        <FormContainer>
          <Form
            sx={{
              gap: 3,
              height: '100%',
              maxWidth: undefined,
              width: '100%',
            }}
          >
            <Stack gap={0.5}>
              <FormLabel htmlFor="name" sx={{ fontWeight: 600 }}>
                {t('name', { ns: 'onboarding' })}
              </FormLabel>
              <TextField
                control={control}
                id="name"
                name="name"
                placeholder={t('namePlaceholder', { ns: 'onboarding' })}
                value={name}
              />
              {errors.name && (
                <Typography color="error" variant="caption">
                  {errors.name.message}
                </Typography>
              )}
            </Stack>

            <Stack gap={0.5}>
              <FormLabel htmlFor="jobTitle" sx={{ fontWeight: 600 }}>
                {t('title', { ns: 'onboarding' })}
              </FormLabel>
              <TextField
                control={control}
                id="jobTitle"
                name="jobTitle"
                placeholder={t('titlePlaceholder', { ns: 'onboarding' })}
                value={jobTitle}
              />
              {errors.jobTitle && (
                <Typography color="error" variant="caption">
                  {errors.jobTitle.message}
                </Typography>
              )}
            </Stack>

            <Stack gap={0.5}>
              <FormLabel htmlFor="department" sx={{ fontWeight: 600 }}>
                {t('department', { ns: 'onboarding' })}
              </FormLabel>
              <TextField
                control={control}
                id="department"
                name="department"
                placeholder={t('departmentPlaceholder', { ns: 'onboarding' })}
                value={department}
              />
              {errors.department && (
                <Typography color="error" variant="caption">
                  {errors.department.message}
                </Typography>
              )}
            </Stack>

            <Stack gap={0.5}>
              <FormLabel sx={{ fontWeight: 600 }}>
                {t('language', { ns: 'onboarding' })}
              </FormLabel>
              <Stack
                alignItems="center"
                direction="row"
                spacing={2}
                width="100%"
              >
                <Button
                  color={selectedLanguage === 'en' ? 'primary' : 'inherit'}
                  onClick={() => setLanguage('en')}
                  variant={selectedLanguage === 'en' ? 'contained' : 'outlined'}
                >
                  {t('english', { ns: 'onboarding' })}
                </Button>
                <Button
                  color={selectedLanguage === 'ja' ? 'primary' : 'inherit'}
                  onClick={() => setLanguage('ja')}
                  variant={selectedLanguage === 'ja' ? 'contained' : 'outlined'}
                >
                  {t('japanese', { ns: 'onboarding' })}
                </Button>
              </Stack>
            </Stack>
          </Form>
        </FormContainer>
      </Stack>
    </PulseSetupLayout>
  )
}

export default UserSetup

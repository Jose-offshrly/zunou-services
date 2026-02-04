import { zodResolver } from '@hookform/resolvers/zod'
import {
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { UpdateOrganizationInput } from '@zunou-graphql/core/graphql'
import { useGetOrganizationQuery } from '@zunou-queries/core/hooks/useGetOrganizationQuery'
import { useUpdateOrganizationMutation } from '@zunou-queries/core/hooks/useUpdateOrganizationMutation'
import { theme } from '@zunou-react/services/Theme'
import React, { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useOrganization } from '~/hooks/useOrganization'
import {
  UpdateOrganizationParams,
  updateOrganizationSchema,
} from '~/schemas/UpdateOrganizationSchema'

import { OrganizationIconSection } from './OrganizationIconSection'

interface GeneralTabProps {
  isEditMode?: boolean
  onSave?: () => void
  onCancel?: () => void
  onSubmitRef?: React.MutableRefObject<(() => void) | null>
  onFormChange?: (hasChanges: boolean) => void
  onCancelRef?: React.MutableRefObject<(() => void) | null>
}

export const GeneralTab = ({
  isEditMode = false,
  onSubmitRef,
  onFormChange,
  onCancelRef,
}: GeneralTabProps) => {
  const { t } = useTranslation(['common', 'settings'])
  const { organizationId } = useOrganization()

  const { data: organizationData } = useGetOrganizationQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })
  const organizationDetails = organizationData?.organization

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateOrganizationParams>({
    mode: 'onChange',
    resolver: zodResolver(updateOrganizationSchema),
    values: {
      description: organizationDetails?.description ?? '',
      domain: organizationDetails?.domain ?? '',
      industry: Array.isArray(organizationDetails?.industry)
        ? organizationDetails.industry.join(', ')
        : organizationDetails?.industry ?? '',
      name: organizationDetails?.name ?? '',
    },
  })

  const { description, domain, industry, name } = useWatch({ control })

  const { mutate: updateOrganization } = useUpdateOrganizationMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const onSubmitHandler = handleSubmit((data: UpdateOrganizationParams) => {
    const industryArray =
      data.industry
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean) ?? []

    const input: UpdateOrganizationInput = {
      description: data.description?.trim(),
      domain: data.domain?.trim(),
      industry: industryArray,
      name: data.name?.trim() ?? '',
      organizationId,
    }

    updateOrganization(input, {
      onError: (error) => {
        console.error('Failed to update organization: ', error)
        toast.error(t('failed_to_update_organization', { ns: 'settings' }))
      },
      // onSuccess: (_, variables) => {
      //   if (!variables.fileKey) {
      //     toast.success(
      //       t('organization_settings_updated_successfully', { ns: 'settings' }),
      //     )
      //   }
      //   onSave?.()
      // },
    })
  })

  const handleCancel = () => {
    reset({
      description: organizationDetails?.description ?? '',
      domain: organizationDetails?.domain ?? '',
      industry: Array.isArray(organizationDetails?.industry)
        ? organizationDetails.industry.join(', ')
        : organizationDetails?.industry ?? '',
      name: organizationDetails?.name ?? '',
    })
  }

  useEffect(() => {
    if (onSubmitRef) {
      onSubmitRef.current = onSubmitHandler
    }
  }, [onSubmitHandler, onSubmitRef])

  useEffect(() => {
    if (onCancelRef) {
      onCancelRef.current = handleCancel
    }
  }, [handleCancel, onCancelRef])

  useEffect(() => {
    if (onFormChange && isEditMode) {
      onFormChange(isDirty)
    }
  }, [isDirty, onFormChange, isEditMode])

  const renderViewMode = () => (
    <Stack spacing={2}>
      <Stack>
        <Typography fontWeight="bold" variant="h6">
          {t('general_settings', { ns: 'settings' })}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {t('org_settings_description', { ns: 'settings' })}
        </Typography>
      </Stack>

      <TableContainer>
        <Table
          size="small"
          sx={{
            '& tr td:first-of-type': {
              color: 'text.secondary',
              py: 2,
              width: 120,
            },
            '& tr:last-child td': {
              borderBottom: 'none',
            },
          }}
        >
          <TableBody>
            <OrganizationIconSection
              organizationDetails={organizationDetails}
            />
            <TableRow>
              <TableCell>{t('name')}</TableCell>
              <TableCell>
                <Typography variant="body2">{name?.trim() || 'N/A'}</Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('domain')}</TableCell>
              <TableCell>
                <Typography variant="body2">
                  {domain?.trim() || 'N/A'}
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('industry')}</TableCell>
              <TableCell>
                {industry?.split(',').filter(Boolean).length ? (
                  <Stack direction="row" spacing={1}>
                    {industry.split(',').map((item: string, index: number) => (
                      <Chip
                        key={index}
                        label={item.trim()}
                        size="medium"
                        sx={{
                          '& .MuiChip-label': {
                            px: 0,
                          },
                          bgcolor: 'white',
                          border: `1px solid ${alpha(
                            theme.palette.primary.main,
                            0.1,
                          )}`,
                          borderRadius: 1,
                          color: 'text.primary',
                          fontSize: 14,
                          fontWeight: 400,
                          px: 1,
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2">N/A</Typography>
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('description')}</TableCell>
              <TableCell>
                <Typography variant="body2">
                  {description?.trim() || 'N/A'}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )

  const renderEditMode = () => (
    <Stack spacing={2}>
      <Stack>
        <Typography fontWeight="bold" variant="h6">
          {t('general_settings', { ns: 'settings' })}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {t('org_settings_description', { ns: 'settings' })}
        </Typography>
      </Stack>

      <TableContainer>
        <Table
          size="small"
          sx={{
            '& tr td:first-of-type': {
              color: 'text.secondary',
              py: 2,
              width: 120,
            },
            '& tr:last-child td': {
              borderBottom: 'none',
            },
          }}
        >
          <TableBody>
            <OrganizationIconSection
              organizationDetails={organizationDetails}
            />
            <TableRow>
              <TableCell>{t('name')}</TableCell>
              <TableCell>
                <TextField
                  {...register('name')}
                  error={!!errors.name}
                  fullWidth={true}
                  helperText={errors.name?.message}
                  id="name"
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('domain')}</TableCell>
              <TableCell>
                <TextField
                  {...register('domain')}
                  error={!!errors.domain}
                  fullWidth={true}
                  helperText={errors.domain?.message}
                  id="domain"
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('industry')}</TableCell>
              <TableCell>
                <TextField
                  {...register('industry')}
                  defaultValue={organizationDetails?.industry?.join(', ')}
                  fullWidth={true}
                  id="industry"
                  placeholder="Enter industries separated by commas"
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('description')}</TableCell>
              <TableCell>
                <TextField
                  {...register('description')}
                  error={!!errors.description}
                  fullWidth={true}
                  helperText={errors.description?.message}
                  id="description"
                  multiline={true}
                  rows={4}
                  size="small"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )

  return isEditMode ? renderEditMode() : renderViewMode()
}

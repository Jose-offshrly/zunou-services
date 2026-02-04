import { Add, ChevronLeft, Remove } from '@mui/icons-material'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import {
  alpha,
  Box,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { OrganizationUserRole } from '@zunou-graphql/core/graphql'
import { useInviteUserMutation } from '@zunou-queries/core/hooks/useInviteUserMutation'
import { Button, IconButton, LoadingButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useOrganization } from '~/hooks/useOrganization'
import { zodResolver } from '~/libs/zod'
import {
  InviteUsersParams,
  inviteUsersSchema,
} from '~/schemas/InviteOrganizationUserSchema'

import { RoleSelector } from './RoleSelector'

export const MemberInviteForm = ({
  onBackClick,
}: {
  onBackClick: () => void
}) => {
  const { t } = useTranslation(['common', 'settings'])
  const { organizationId } = useOrganization()

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<InviteUsersParams>({
    defaultValues: {
      input: [
        {
          email: '',
          name: '',
          organizationId,
          role: OrganizationUserRole.User,
        },
      ],
    },
    resolver: zodResolver(inviteUsersSchema),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'input',
  })

  const { mutateAsync: inviteUsers, isPending: isPendingInvitation } =
    useInviteUserMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const onSubmit = async ({ input }: InviteUsersParams) => {
    try {
      await inviteUsers(input)

      toast.success(t('invite_success', { ns: 'settings' }))
      onBackClick()
    } catch (error) {
      toast.error(t('invite_failed', { ns: 'settings' }))
      console.error(error)
    }
  }

  return (
    <Stack>
      <Button
        color="inherit"
        onClick={onBackClick}
        startIcon={<ChevronLeft fontSize="small" />}
        sx={{ alignSelf: 'start' }}
      >
        {t('back')}
      </Button>
      <Stack spacing={2}>
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
        >
          <Stack>
            <Typography fontWeight={700} variant="h6">
              {t('invite_team_member', { ns: 'settings' })}
            </Typography>
            <Box>
              <Typography color="text.secondary" variant="body2">
                {t('invite_instructions', { ns: 'settings' })}
              </Typography>
            </Box>
          </Stack>
          <Button
            disabled={true}
            startIcon={<QrCodeScannerIcon fontSize="small" />}
            sx={{ display: 'none' }}
            variant="outlined"
          >
            <Typography variant="body2">
              {t('scan_card', { ns: 'settings' })}
            </Typography>
          </Button>
        </Stack>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack alignItems="start" spacing={2}>
            {fields.map((field, index) => (
              <Stack
                alignItems="center"
                direction="row"
                key={field.id}
                spacing={1}
                width="100%"
              >
                <Controller
                  control={control}
                  name={`input.${index}.name`}
                  render={({ field }) => (
                    <TextField {...field} label={t('name')} size="small" />
                  )}
                />
                <Controller
                  control={control}
                  name={`input.${index}.email`}
                  render={({ field }) => (
                    <TextField {...field} label={t('email')} size="small" />
                  )}
                />
                <Controller
                  control={control}
                  name={`input.${index}.role`}
                  render={({ field: { onChange, value } }) => (
                    <RoleSelector onChange={onChange} value={value} />
                  )}
                  rules={{ required: 'Role is required' }}
                />
                <IconButton
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  size="small"
                >
                  <Remove color="inherit" fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button
              color="inherit"
              onClick={() =>
                append({
                  email: '',
                  name: '',
                  organizationId,
                  role: OrganizationUserRole.User,
                })
              }
              size="small"
              startIcon={<Add fontSize="small" />}
              sx={{ display: 'none' }}
            >
              {t('add_row', { ns: 'settings' })}
            </Button>

            <Stack spacing={2} sx={{ marginTop: 'auto' }} width="100%">
              <Divider
                sx={{ borderColor: alpha(theme.palette.primary.main, 0.1) }}
              />
              <LoadingButton
                disabled={!isValid || isPendingInvitation}
                loading={isPendingInvitation}
                onClick={handleSubmit(onSubmit)}
                size="large"
                sx={{ alignSelf: 'flex-end' }}
                type="button"
                variant="contained"
              >
                {t('send_invite', { ns: 'settings' })}
              </LoadingButton>
            </Stack>
          </Stack>
        </form>
      </Stack>
    </Stack>
  )
}

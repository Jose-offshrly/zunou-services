import { zodResolver } from '@hookform/resolvers/zod'
import { Stack } from '@mui/material'
import { useCreateOrganizationGroupMutation } from '@zunou-queries/core/hooks/useCreateOrganizationGroupMutation'
import { TextField } from '@zunou-react/components/form'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { useOrganization } from '~/hooks/useOrganization'
import {
  CreateOrganizationGroupParams,
  createOrganizationGroupSchema,
} from '~/schemas/CreateOrganizationGroupSchema'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
  const { t } = useTranslation(['common', 'org'])
  const { pulseId } = useParams<{ pulseId: string }>()
  const { organizationId } = useOrganization()

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<CreateOrganizationGroupParams>({
    defaultValues: {
      description: '',
      name: '',
    },
    mode: 'onChange',
    resolver: zodResolver(createOrganizationGroupSchema),
  })

  const { name, description } = watch()

  const {
    mutate: createOrganizationGroup,
    isPending: isCreatingOrganizationGroup,
  } = useCreateOrganizationGroupMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId,
    },
  })

  const onSubmit = ({ name, description }: CreateOrganizationGroupParams) => {
    if (!pulseId) return

    createOrganizationGroup(
      {
        description,
        name,
        organizationId,
        pulseId,
      },
      {
        onError: () => {
          toast.error(t('create_group_error', { ns: 'org' }))
        },
        onSettled: () => {
          onClose()
          reset()
        },
        onSuccess: () => {
          toast.success(t('create_group_success', { ns: 'org' }))
        },
      },
    )
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <CustomModalWithSubmit
      disabledSubmit={!isValid}
      isOpen={isOpen}
      isSubmitting={isCreatingOrganizationGroup}
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={handleSubmit(onSubmit)}
      submitText={t('create')}
      title={t('create_group_prompt', { ns: 'org' })}
      type="default"
    >
      <Stack spacing={3} sx={{ minWidth: 400, py: 2 }}>
        <TextField
          autoFocus={true}
          control={control}
          error={errors.name}
          label={t('name')}
          name="name"
          value={name}
        />

        <TextField
          control={control}
          error={errors.description}
          label={t('description')}
          multiline={true}
          name="description"
          rows={4}
          value={description}
        />
      </Stack>
    </CustomModalWithSubmit>
  )
}

export default CreateGroupModal

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { zodResolver } from '@hookform/resolvers/zod'
import { DeleteOutline, PeopleOutline } from '@mui/icons-material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import { alpha, IconButton, Stack, Typography } from '@mui/material'
import { PulseMember } from '@zunou-graphql/core/graphql'
import { useUpdateOrganizationGroupMutation } from '@zunou-queries/core/hooks/useUpdateOrganizationGroupMutation'
import { TextField } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import _ from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import {
  UpdateOrganizationGroupParams,
  updateOrganizationGroupSchema,
} from '~/schemas/UpdateOrganizationGroupSchema'

import DeleteGroupModal from './DeleteGroupModal'
import { MemberCard } from './MemberCard'

export type OrgChartPulseMember = PulseMember & {
  order?: number | null
}

interface GroupProps {
  id: string
  title: string
  members: PulseMember[]
  description?: string
  backgroundColor: string
  isExpanded?: boolean
  canEdit: boolean
  onRename?: (newName: string) => void
}

const MAX_DESC_LENGTH = 100

export const Group = ({
  id,
  title,
  members,
  description = 'No description',
  backgroundColor,
  isExpanded = false,
  canEdit,
  onRename,
}: GroupProps) => {
  const { t } = useTranslation(['common', 'org'])
  const { setNodeRef } = useDroppable({
    data: {
      type: 'group',
    },
    id,
  })
  const [isSeeMore, setSeeMore] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const groupRef = useRef<HTMLDivElement | null>(null)
  const { pulseId } = useParams()

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    reset,
    watch,
  } = useForm<UpdateOrganizationGroupParams>({
    defaultValues: {
      description,
      name: title,
      organizationGroupId: id,
    },
    mode: 'onChange',
    resolver: zodResolver(updateOrganizationGroupSchema),
  })

  const { name, description: desc } = watch()

  const { mutateAsync: updateGroup } = useUpdateOrganizationGroupMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      input: {
        description,
        id,
        name: title,
      },
      pulseId: pulseId,
    },
  })

  const onSubmit = async (data: UpdateOrganizationGroupParams) => {
    try {
      await updateGroup({
        description: data.description || '',
        id,
        name: data.name,
      })
      onRename?.(data.name)
      setIsEditing(false)
      toast.success(t('update_group_success', { ns: 'org' }))
    } catch (error) {
      toast.error(t('update_group_error', { ns: 'org' }))
    }
  }

  useEffect(() => {
    setValue('name', title)
    setValue('description', description || '')

    if (!isEditing) {
      reset({
        description: description || '',
        name: title,
        organizationGroupId: id,
      })
    }
  }, [title, description, id, setValue, reset, isEditing])

  const sortedMemberIds = members
    .sort(
      (a, b) =>
        ((a as OrgChartPulseMember).order || 0) -
        ((b as OrgChartPulseMember).order || 0),
    )
    .map((member) => member.id)

  return (
    <>
      <Stack
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        ref={(node) => {
          setNodeRef(node)
          groupRef.current = node
        }}
        sx={{
          bgcolor: backgroundColor,
          borderRadius: '30px',
          flexShrink: 0,
          gap: 2,
          height: '100%',
          maxWidth: { lg: 400, xs: 300 },
          minWidth: { lg: 400, xs: 280 },
          width: { lg: 400, xs: 300 },
        }}
      >
        <Stack
          justifyContent="start"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          sx={{
            height: 'auto',
            p: 3,
            position: 'relative',
          }}
        >
          {isEditing ? (
            canEdit && (
              <>
                <Stack
                  alignItems="center"
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="h6">Editing Group</Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() => {
                        setSeeMore(false)
                        setIsEditing(false)
                        reset({
                          description: description || '',
                          name: title,
                          organizationGroupId: id,
                        })
                      }}
                      size="small"
                      sx={{
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                    <IconButton
                      disabled={!isValid}
                      onClick={handleSubmit(onSubmit)}
                      size="small"
                      sx={{
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <CheckIcon />
                    </IconButton>
                  </Stack>
                </Stack>
                <Stack gap={2}>
                  <TextField
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
                    name="description"
                    value={desc}
                  />
                </Stack>
              </>
            )
          ) : (
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
              position="relative"
            >
              <Typography
                fontSize={20}
                fontWeight="bold"
                sx={{ wordBreak: 'break-word' }}
              >
                {title}
              </Typography>
              {canEdit && (
                <Stack alignItems="center" direction="row" gap={1}>
                  <IconButton
                    onClick={() => setIsDeleteModalOpen(true)}
                    size="small"
                    sx={{
                      color: 'error.main',
                      opacity: hover ? 1 : 0,
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => setIsEditing(true)}
                    size="small"
                    sx={{
                      opacity: hover ? 1 : 0,
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )}
            </Stack>
          )}
          {!isEditing && (
            <Typography
              color="text.secondary"
              sx={{ mt: 1, wordBreak: 'break-word' }}
              variant="body2"
            >
              {isSeeMore
                ? description
                : _.truncate(description, { length: MAX_DESC_LENGTH })}
              {description.length > MAX_DESC_LENGTH && (
                <>
                  {' '}
                  <Typography
                    component="span"
                    onClick={() => setSeeMore(!isSeeMore)}
                    sx={{
                      '&:hover': {
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      },
                      color: theme.palette.primary.main,
                    }}
                    variant="body2"
                  >
                    {isSeeMore ? t('see_less') : t('see_more')}
                  </Typography>
                </>
              )}
            </Typography>
          )}
        </Stack>

        <Stack
          gap={2}
          height="80%"
          sx={{
            minHeight: '50px',
            overflowY: 'auto',
            p: 2,
          }}
        >
          {members.length > 0 ? (
            <SortableContext
              items={sortedMemberIds}
              strategy={verticalListSortingStrategy}
            >
              {members.map((member) => (
                <MemberCard
                  canEdit={canEdit}
                  isExpanded={isExpanded}
                  key={member.id}
                  member={{
                    ...member,
                    groupId: id,
                  }}
                />
              ))}
            </SortableContext>
          ) : (
            <Stack
              alignItems="center"
              height="100%"
              justifyContent="center"
              spacing={2}
              sx={{
                borderRadius: 2,
                p: 2,
              }}
              width="100%"
            >
              <Stack
                bgcolor={alpha(theme.palette.text.primary, 0.05)}
                border={1}
                borderColor="divider"
                borderRadius="50%"
                p={2}
                sx={{
                  '&:hover': {
                    bgcolor: alpha(theme.palette.text.primary, 0.08),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <PeopleOutline sx={{ fontSize: 24 }} />
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                {t('no_group_members_assigned', { ns: 'org' })}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>

      <DeleteGroupModal
        description={description}
        id={id}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={title}
      />
    </>
  )
}

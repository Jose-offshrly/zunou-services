import { Box, Stack, Typography } from '@mui/material'
import { alpha, lighten } from '@mui/material/styles'
import { Pulse, UserPresence } from '@zunou-graphql/core/graphql'
import { useDeletePulseMutation } from '@zunou-queries/core/hooks/useDeletePulseMutation'
import Avatar from '@zunou-react/components/utility/Avatar'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { getFirstLetter } from '@zunou-react/utils/getFirstLetter'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { getPresenceColor } from '~/utils/presenceUtils'

interface OtherMember {
  id: string
  name: string
  gravatar?: string | null
  presence?: UserPresence | null
}

interface Props {
  handleClose: () => void
  isOpen: boolean
  pulse: Pulse | null
  otherMember: OtherMember | null
}

export const DeleteOneToOneModal = ({
  handleClose,
  isOpen,
  pulse,
  otherMember,
}: Props) => {
  const { organizationId } = useOrganization()
  const navigate = useNavigate()

  const { mutate: deletePulse } = useDeletePulseMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleDeleteConfirm = () => {
    if (!pulse?.id) return

    deletePulse(
      { pulseId: pulse.id },
      {
        onError: (error) => {
          toast.error('Failed to delete pulse')
          console.error(error)
        },
        onSuccess: () => {
          toast.success('Pulse deleted successfully')
          handleClose()

          navigate(
            pathFor({
              pathname: Routes.OrganizationBootstrap,
              query: {
                organizationId,
              },
            }),
          )
        },
      },
    )
  }

  if (!otherMember) return null

  return (
    <CustomModalWithSubmit
      isOpen={isOpen}
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={handleDeleteConfirm}
      style={{ maxWidth: 400 }}
      title="Delete One-to-One Pulse"
    >
      <Stack
        alignItems="center"
        gap={4}
        height="100%"
        justifyContent="center"
        py={1}
        width="100%"
      >
        <Stack
          alignItems="center"
          border={`1px solid ${lighten(theme.palette.primary.main, 0.9)}`}
          borderRadius={1}
          justifyContent="center"
          p={1.5}
          spacing={1}
          sx={{
            aspectRatio: '1 / 1',
          }}
          width="fit-content"
        >
          <Box
            bgcolor={alpha(theme.palette.primary.main, 0.1)}
            borderRadius={2}
            p={0.5}
          >
            <Avatar
              badgeColor={getPresenceColor(
                otherMember.presence ?? UserPresence.Offline,
              )}
              isDarkMode={false}
              placeholder={getFirstLetter(otherMember.name)?.toUpperCase()}
              showBadge={true}
              src={otherMember.gravatar || undefined}
              sx={{ height: 32, width: 32 }}
              variant="rounded"
            />
          </Box>
          <Typography
            sx={{
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              display: '-webkit-box',
              fontSize: 14,
              fontWeight: 700,
              maxWidth: 100,
              overflow: 'hidden',
            }}
            textAlign="center"
          >
            {otherMember.name}
          </Typography>
        </Stack>
        <Typography>
          Are you sure you want to delete this one-to-one pulse?
        </Typography>
      </Stack>
    </CustomModalWithSubmit>
  )
}

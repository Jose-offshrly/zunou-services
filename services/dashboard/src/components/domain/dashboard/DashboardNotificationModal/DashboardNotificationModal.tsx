import { alpha, Avatar, Stack, Typography } from '@mui/material'
import { Notification } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'

import ZunouIcon from '~/assets/zunou-icon'
import { CustomModal } from '~/components/ui/CustomModal'
import { formatTimeAgo } from '~/utils/formatTimeAgo'

interface ActionRowProps {
  title: string
  buttonText: string
}

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  notification: Notification
}

const ActionRow = ({ title, buttonText }: ActionRowProps) => (
  <Stack
    alignItems="center"
    border={1}
    borderColor={(theme) => alpha(theme.palette.primary.main, 0.1)}
    borderRadius={2}
    direction="row"
    justifyContent="space-between"
    p={2}
  >
    <Typography fontSize={14} fontWeight={400}>
      {title}
    </Typography>
    <Button
      color="primary"
      size="small"
      sx={{ borderColor: alpha(theme.palette.primary.main, 0.1), width: 100 }}
      variant="outlined"
    >
      {buttonText}
    </Button>
  </Stack>
)

export const NotificationModal = ({
  isOpen,
  onClose,
  notification,
}: NotificationModalProps) => {
  const timeAgo = formatTimeAgo(new Date(notification.created_at))
  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Notification">
      <Stack
        border={1}
        borderColor={(theme) => alpha(theme.palette.primary.main, 0.1)}
        borderRadius={2}
        p={2}
        spacing={2}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          mb={1}
        >
          <Stack alignItems="center" direction="row" spacing={1}>
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                fontSize: 12,
                height: 24,
                width: 24,
              }}
              variant="rounded"
            >
              {notification.organization.name[0]?.toUpperCase()}
            </Avatar>
            <Stack alignItems="center" direction="row" spacing={1}>
              <Typography fontSize={12}>
                {notification.organization.name[0]}
              </Typography>
              <Typography fontSize={12}>•</Typography>
              <Typography fontSize={12}>{timeAgo}</Typography>
            </Stack>
          </Stack>
          <ZunouIcon />
        </Stack>

        <Stack>
          <Typography fontSize={16} fontWeight={500}>
            {notification.description}
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <ActionRow
            buttonText="Create"
            title="Create a survey about working hours"
          />
          <ActionRow
            buttonText="Send PM"
            title="Send an email to discuss possible issues"
          />
          <ActionRow
            buttonText="Create"
            title="Create a meeting agenda for follow up meeting"
          />
          <ActionRow
            buttonText="Create"
            title="Set goals and guides for the company"
          />
        </Stack>
      </Stack>
    </CustomModal>
  )
}

import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import {
  Avatar,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Notification, NotificationStatus } from '@zunou-graphql/core/graphql'
import { useUpdateNotificationStatusMutation } from '@zunou-queries/core/hooks/useUpdateNotificationStatusMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

// NOTE: Temporarily disable notification actions (dismiss | resolve)
// interface UndoActionToastProps {
//   actionText: string
//   notification: Notification
//   t: Toast
//   updateStatus: ({
//     notificationId,
//     status,
//   }: {
//     notificationId: string
//     status: NotificationStatus
//   }) => void
// }

// const NotificationButton = ({
//   label,
//   showCheckmark = false,
//   disabled,
//   onClick,
// }: {
//   label: string
//   showCheckmark?: boolean
//   disabled: boolean
//   onClick?: (event: React.MouseEvent) => void
// }) => (
//   <Button
//     disabled={disabled}
//     onClick={onClick}
//     size="small"
//     sx={{
//       '&.Mui-disabled': {
//         borderColor: alpha(theme.palette.primary.main, 0.1),
//         color: 'text.primary',
//       },
//       bgcolor: alpha(theme.palette.primary.main, 0.03),
//       borderColor: alpha(theme.palette.primary.main, 0.1),
//       color: 'text.primary',
//     }}
//     variant="outlined"
//   >
//     <Stack alignItems="center" direction="row" spacing={1}>
//       {showCheckmark && (
//         <CheckIcon sx={{ color: 'primary.main', fontSize: 16 }} />
//       )}
//       <Typography fontSize={12} fontWeight={400}>
//         {label}
//       </Typography>
//     </Stack>
//   </Button>
// )

// const UndoActionToast = ({
//   actionText,
//   notification,
//   t,
//   updateStatus,
// }: UndoActionToastProps) => {
//   return (
//     <Stack
//       alignItems="center"
//       direction="row"
//       justifyContent="space-between"
//       spacing={1}
//       sx={{
//         maxWidth: '500px',
//       }}
//     >
//       <Stack
//         alignItems="center"
//         direction="row"
//         justifyContent="space-between"
//         maxWidth="350px"
//         spacing={1}
//       >
//         <Stack
//           alignItems="center"
//           direction="row"
//           flex={1}
//           overflow="hidden"
//           spacing={1}
//         >
//           <Typography
//             color="text.primary"
//             fontSize={14}
//             fontWeight={600}
//             noWrap={true}
//           >
//             {notification.organization.name}
//           </Typography>
//           <Typography
//             color="text.secondary"
//             flex={1}
//             fontSize={14}
//             fontWeight={200}
//             noWrap={true}
//             overflow="hidden"
//             textOverflow="ellipsis"
//             whiteSpace="nowrap"
//           >
//             {notification.description}
//           </Typography>
//         </Stack>
//         <Typography fontSize={14}>has been {actionText}</Typography>
//       </Stack>
//       <Stack
//         alignItems="center"
//         direction="row"
//         spacing={1}
//         sx={{ flexShrink: 0 }}
//       >
//         <Button
//           onClick={() => {
//             updateStatus({
//               notificationId: notification.id,
//               status: NotificationStatus.Pending,
//             })
//             toast.dismiss(t.id)
//           }}
//           sx={{
//             color: theme.palette.primary.main,
//             fontSize: '14px',
//             minWidth: 'auto',
//             textDecoration: 'underline',
//           }}
//         >
//           Undo
//         </Button>
//         <Close
//           fontSize="small"
//           onClick={() => toast.dismiss(t.id)}
//           sx={{ cursor: 'pointer' }}
//         />
//       </Stack>
//     </Stack>
//   )
// }

export const DashboardNotificationCard = ({
  notification,
}: {
  notification: Notification
}) => {
  const navigate = useNavigate()
  const { userRole } = useAuthContext()
  const { organizationId } = useOrganization()

  const rolePrefix = userRole === UserRoleEnum.MANAGER ? 'manager' : 'employee'

  const isNotificationClosed =
    notification.status === NotificationStatus.Dismissed ||
    notification.status === NotificationStatus.Resolved

  const { mutate: updateStatus } = useUpdateNotificationStatusMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleCardClick = (pulseId?: string | null) => {
    updateStatus(
      {
        notificationId: notification.id,
        status: NotificationStatus.Dismissed,
      },
      {
        onSettled: () => {
          if (!pulseId) return

          const path = pathFor({
            pathname: Routes.PulseDetail,
            query: { organizationId, pulseId },
          })

          navigate(`/${rolePrefix}/${path}?openNotifs=true`)
        },
      },
    )
  }

  return (
    <Card
      sx={{
        backgroundColor: isNotificationClosed
          ? alpha(theme.palette.primary.main, 0.02)
          : 'white',
        borderColor: alpha(theme.palette.primary.main, 0.1),
        borderRadius: 2,
        borderStyle: 'solid',
        borderWidth: 1,
        boxShadow: 'none',
        width: '100%',
      }}
    >
      <CardActionArea onClick={() => handleCardClick(notification.pulse?.id)}>
        <CardContent
          sx={{
            '&:last-child': {
              paddingBottom: 2,
            },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
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
                {notification.organization.name[0].toUpperCase()}
              </Avatar>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Typography fontSize={12}>
                  {notification.organization.name}
                </Typography>
                <Typography fontSize={12}>•</Typography>
                <Typography fontSize={12}>
                  {notification.pulse?.name}
                </Typography>
                <Typography fontSize={12}>•</Typography>
                <Typography fontSize={12}>{notification.created_at}</Typography>
              </Stack>
            </Stack>
            {notification.status === NotificationStatus.Pending && (
              <FiberManualRecordIcon
                sx={{ color: 'secondary.main', fontSize: 8 }}
              />
            )}
          </Stack>

          <Stack>
            <Typography
              fontSize={14}
              sx={{
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                color: 'text.primary',
                display: '-webkit-box',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {notification.description}
            </Typography>
          </Stack>

          {/* NOTE: Temporarily disable the notification actions feature
          <CardActions
            sx={{ justifyContent: 'start', padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {notification.status === NotificationStatus.Resolved && (
              <NotificationButton
                disabled={true}
                label="Resolved"
                showCheckmark={true}
              />
            )}
            {isActionable && (
              <>
                <NotificationButton
                  disabled={isNotificationClosed}
                  label="Take Action"
                  onClick={onCardClick}
                />
                <NotificationButton
                  disabled={isNotificationClosed}
                  label="Resolve"
                  onClick={handleStatusUpdate(NotificationStatus.Resolved)}
                />
                <NotificationButton
                  disabled={isNotificationClosed}
                  label="Dismiss"
                  onClick={handleStatusUpdate(NotificationStatus.Dismissed)}
                />
              </>
            )}
          </CardActions> */}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

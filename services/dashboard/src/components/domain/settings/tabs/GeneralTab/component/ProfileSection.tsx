import { LaunchOutlined } from '@mui/icons-material'
import {
  Avatar,
  Link,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { getFirstLetter } from '@zunou-react/utils/getFirstLetter'
import { useTranslation } from 'react-i18next'

export const ProfileSection = ({ user }: { user: User }) => {
  const { t } = useTranslation()

  const getProfilePictureUrl = () => {
    return user?.gravatar || undefined
  }

  const profilePictureUrl = getProfilePictureUrl()

  return (
    <TableRow>
      <TableCell sx={{ width: '37%' }}>{t('profile_picture')}</TableCell>
      <TableCell sx={{ flex: 1, width: '63%' }}>
        <Stack alignItems="center" direction="row" spacing={2} width="100%">
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
            sx={{ flex: 1, minWidth: 0 }}
          >
            <Avatar
              src={profilePictureUrl}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                height: 32,
                width: 32,
              }}
            >
              {!profilePictureUrl && getFirstLetter(user?.name)}
            </Avatar>

            {user?.email && (
              <Stack direction="column" sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  color="text.primary"
                  fontSize="small"
                  sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}
                  variant="body2"
                >
                  {t('signed_in')}
                </Typography>
                <Typography
                  color="text.primary"
                  component="span"
                  fontSize="small"
                  sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  variant="body2"
                >
                  {user.email}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Tooltip title={t('change_profile_picture', { ns: 'common' })}>
          <Link
            href="https://gravatar.com/profile/avatars"
            rel="noopener noreferrer"
            sx={{
              alignItems: 'center',
              color: theme.palette.primary.main,
              display: 'inline-flex',
              fontSize: 'small',
              gap: 0.5,
            }}
            target="_blank"
          >
            <LaunchOutlined sx={{ fontSize: '1rem' }} />
            {t('change')}
          </Link>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

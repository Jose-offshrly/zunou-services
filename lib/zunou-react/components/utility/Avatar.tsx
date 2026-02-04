import {
  Avatar as BaseAvatar,
  AvatarProps as MUIAvatarProps,
  Badge,
} from '@mui/material'

interface AvatarWithBadgeProps extends Omit<MUIAvatarProps, 'src'> {
  placeholder?: string
  src?: string | null
  isDarkMode?: boolean
  badgeColor?: string
  showBadge?: boolean
  size?: 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge'
  transparentBg?: boolean
}

const sizeMap = {
  extraLarge: 64,
  extraSmall: 20,
  large: 48,
  medium: 40,
  small: 32,
}

const badgeSizeMap = {
  extraLarge: 16,
  extraSmall: 6,
  large: 14,
  medium: 12,
  small: 10,
}

const borderWidthMap = {
  extraLarge: 3,
  extraSmall: 0.8,
  large: 2.5,
  medium: 2,
  small: 1.5,
}

const fontSizeMap = {
  extraLarge: 26,
  extraSmall: 10,
  large: 20,
  medium: 16,
  small: 14,
}

const Avatar = ({
  placeholder = '',
  src = null,
  badgeColor = 'grey.400',
  isDarkMode = false,
  showBadge = false,
  variant = 'rounded',
  size = 'medium',
  transparentBg = false,
  sx,
  ...props
}: AvatarWithBadgeProps) => {
  const avatarSize = sizeMap[size]
  const badgeSize = badgeSizeMap[size]
  const borderWidth = borderWidthMap[size]
  const fontSize = fontSizeMap[size]

  const avatar = (
    <BaseAvatar
      src={src ?? undefined}
      sx={{
        alignSelf: 'flex-start',
        bgcolor: transparentBg
          ? 'transparent'
          : isDarkMode
            ? 'primary.dark'
            : 'secondary.main',
        fontSize: `${fontSize}px`,
        height: avatarSize,
        width: avatarSize,
        ...sx,
      }}
      variant={variant}
      {...props}
    >
      {!src && placeholder.slice(0, 1).toUpperCase()}
    </BaseAvatar>
  )

  return showBadge ? (
    <Badge
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      overlap="circular"
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: badgeColor,
          border: `${borderWidth}px solid`,
          borderColor: isDarkMode ? 'grey.800' : 'background.paper',
          borderRadius: '50%',
          height: badgeSize,
          width: badgeSize,
        },
      }}
      variant="dot"
    >
      {avatar}
    </Badge>
  ) : (
    avatar
  )
}

export default Avatar

import { Analytics, Star } from '@mui/icons-material'
import {
  alpha,
  Fade,
  Grid,
  lighten,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import React, { ReactNode } from 'react'

interface MessageMenuItemProps {
  icon: ReactNode
  title: string
  description: string
  colorType: 'primary' | 'secondary'
  onItemClick?: (title: string) => void
}

interface MenuItemData {
  title: string
  description: string
}

const primaryMenuItems: MenuItemData[] = [
  {
    description: 'Check overall morale and engagement of your staff.',
    title: 'View Staff Sentiment',
  },
  {
    description:
      'Create and send through clear objectives to unify priorities.',
    title: 'Set Alignment Goals',
  },
  {
    description: 'Inform employees on best practices for time management.',
    title: 'Educate Staff',
  },
]

const secondaryMenuItems: MenuItemData[] = [
  {
    description: 'Distribute a questionnaire to gather feedback and insights.',
    title: 'Send Survey',
  },
  {
    description:
      'Analyze visual data to assess trends and performance metrics.',
    title: 'View Chart',
  },
  {
    description: 'Notify team members about upcoming deadlines or events.',
    title: 'Send Reminder',
  },
]

const MessageMenuItem = ({
  icon,
  title,
  description,
  colorType,
  onItemClick,
}: MessageMenuItemProps) => {
  return (
    <Paper
      elevation={3}
      onClick={() => onItemClick?.(title)}
      sx={{
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: 120,
        padding: '16px',
      }}
    >
      <Stack alignItems="center" direction="row" marginBottom={1}>
        <Stack
          alignItems="center"
          bgcolor={alpha(theme.palette[colorType].main, 0.1)}
          justifyContent="center"
          sx={{
            borderRadius: '50%',
            height: 40,
            marginRight: 1,
            width: 40,
          }}
        >
          {React.cloneElement(icon as React.ReactElement, {
            sx: { color: theme.palette[colorType].main },
          })}
        </Stack>
        <Typography fontSize={14} fontWeight={500} noWrap={true}>
          {title}
        </Typography>
      </Stack>
      <Typography color="textSecondary" fontSize={12} fontWeight={400}>
        {description}
      </Typography>
    </Paper>
  )
}

interface MessageMenuProps {
  isVisible: boolean
  onItemClick: (title: string) => void
}

export const MessageMenu = ({ isVisible, onItemClick }: MessageMenuProps) => {
  return (
    <Fade in={isVisible} mountOnEnter={true} unmountOnExit={true}>
      <Stack
        bgcolor={lighten(theme.palette.primary.main, 0.7)}
        bottom="60px"
        maxWidth={752}
        padding={2}
        pb={4}
        position="absolute"
        sx={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
        width="100%"
        zIndex={0}
      >
        <Stack justifyContent="space-between" marginBottom={2}>
          <Typography fontSize={16} fontWeight={500} marginBottom={2}>
            Help me do this
          </Typography>
          <Grid container={true} spacing={2}>
            {primaryMenuItems.map((item: MenuItemData, index: number) => (
              <Grid item={true} key={index} sm={4} xs={12}>
                <MessageMenuItem
                  {...item}
                  colorType="primary"
                  icon={<Star />}
                  onItemClick={onItemClick}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
        <Stack justifyContent="space-between">
          <Typography fontSize={16} fontWeight={500} marginBottom={2}>
            Other things you might want to do
          </Typography>
          <Grid container={true} spacing={2}>
            {secondaryMenuItems.map((item: MenuItemData, index: number) => (
              <Grid item={true} key={index} sm={4} xs={12}>
                <MessageMenuItem
                  {...item}
                  colorType="secondary"
                  icon={<Analytics />}
                  onItemClick={onItemClick}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Stack>
    </Fade>
  )
}

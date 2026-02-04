import { SearchOffOutlined } from '@mui/icons-material'
import { SvgIconProps, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { ElementType } from 'react'

import { useVitalsContext } from '~/context/VitalsContext'

interface EmptyWidgetPlaceholderProps {
  icon?: ElementType<SvgIconProps>
  content?: string
  maxMessageWidth?: number
}

const EmptyWidgetPlaceholder = ({
  icon: CustomIcon = SearchOffOutlined,
  content = 'It looks like you have no content at the moment. Please check back later!',
  maxMessageWidth = 250,
}: EmptyWidgetPlaceholderProps) => {
  const { setting } = useVitalsContext()

  const isDarkMode = setting.theme === 'dark'

  return (
    <Stack
      sx={{
        alignItems: 'center',
        gap: 1,
        height: '100%',
        justifyContent: 'center',
      }}
    >
      <Stack
        sx={{
          alignItems: 'center',
          bgcolor: isDarkMode ? 'grey.700' : 'grey.100',
          borderRadius: 9999,
          height: 70,
          justifyContent: 'center',
          width: 70,
        }}
      >
        <CustomIcon
          fontSize="large"
          sx={{
            color: isDarkMode ? 'grey.900' : 'grey.400',
          }}
        />
      </Stack>
      <Typography
        color="text.secondary"
        fontSize="small"
        maxWidth={maxMessageWidth}
        textAlign="center"
      >
        {content}
      </Typography>
    </Stack>
  )
}

export default EmptyWidgetPlaceholder

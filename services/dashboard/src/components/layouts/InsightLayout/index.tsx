import { Stack } from '@mui/system'
import { SettingMode } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { Outlet } from 'react-router-dom'

import { useVitalsContext } from '~/context/VitalsContext'

import { Container } from './Container'
import { Header } from './Header'

export const InsightLayout = () => {
  const { background, setting } = useVitalsContext()
  const containerBg =
    setting?.theme === 'dark' ? theme.palette.grey[900] : 'white'

  const backgroundColor =
    setting.mode === SettingMode.Color
      ? setting?.color ?? theme.palette.primary.main
      : setting?.color

  const backgroundImage =
    setting.mode === SettingMode.Image
      ? `url(${background?.image_url})`
      : 'none'

  return (
    <Stack
      height="100vh"
      position="relative"
      px={4}
      py={2}
      spacing={3}
      sx={{
        backgroundAttachment: 'fixed',
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <Header />
      <Container
        borderRadius={3}
        flex={1}
        overflow="auto"
        p={4}
        spacing={4}
        sx={{
          backgroundColor: containerBg,
        }}
      >
        <Outlet />
      </Container>
    </Stack>
  )
}

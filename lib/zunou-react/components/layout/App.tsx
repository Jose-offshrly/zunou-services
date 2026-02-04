import { CacheProvider } from '@emotion/react'
import { CssBaseline, Theme, ThemeProvider } from '@mui/material'
import { Router } from '@remix-run/router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, RouterProvider } from 'react-router-dom'

import { LoadingContext } from '../../contexts/LoadingContext'
import { SnackbarContext } from '../../contexts/SnackbarContext'
import { createEmotionCache, theme } from '../../services/Theme'

const emotionCache = createEmotionCache()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export const AppLayout = () => {
  return (
    <>
      <CssBaseline />
      <Outlet />
    </>
  )
}

interface Props {
  router: Router
  customTheme?: Theme
}

export const App = ({ router, customTheme }: Props) => (
  <QueryClientProvider client={queryClient}>
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={customTheme ?? theme}>
        <SnackbarContext>
          <LoadingContext>
            <RouterProvider router={router} />
          </LoadingContext>
        </SnackbarContext>
      </ThemeProvider>
    </CacheProvider>
  </QueryClientProvider>
)

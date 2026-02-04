import { Box, Stack } from '@mui/system'
import { Outlet } from 'react-router-dom'

import QuickLinks from '../../domain/threads/QuickLinks'
import { ThreadSidebar } from '../../domain/threads/ThreadSidebar'
import { Navbar } from '../Navbar'

export const ThreadLayout = () => {
  return (
    <Stack height="100vh" minHeight="100vh">
      <Navbar />
      <Stack
        direction="row"
        flexGrow={1}
        height="100%"
        justifyContent="space-between"
        overflow="hidden"
      >
        <ThreadSidebar />
        <Outlet />

        {/* NOTE: Removed in v0.1 */}
        <Box sx={{ display: 'none' }}>
          <QuickLinks />
        </Box>
      </Stack>
    </Stack>
  )
}

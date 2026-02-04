import {
  CircularProgress,
  // Divider, // NOTE: Removed in v0.1
  SvgIcon,
  Typography,
} from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { useGetThreadsQuery } from '@zunou-queries/core/hooks/useGetThreadsQuery'
import {
  Button,
  // SearchFilter // NOTE: Removed in v0.1
} from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useNavigate, useParams } from 'react-router-dom'

import ZunouIcon from '~/assets/icons/zunou-icon'
import { ThreadList } from '~/components/domain/threads/ThreadList'

export const ThreadSidebar = () => {
  const { organizationId } = useParams()

  const navigate = useNavigate()

  const { data, isLoading } = useGetThreadsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      type: 'user',
    },
  })

  const handleNewThread = () => {
    navigate(`/organizations/${organizationId}/threads/new`)
  }

  return (
    <Stack
      borderRight={1}
      flexShrink={0}
      spacing={2}
      sx={{
        bgcolor: 'white',
        borderColor: alpha(theme.palette.primary.main, 0.1),
      }}
      width={240}
    >
      <Stack height="100%" paddingX={2} paddingY={3} spacing={4}>
        <Stack spacing={2}>
          <Button
            onClick={handleNewThread}
            size="large"
            sx={{ gap: 1, height: 40 }}
            variant="outlined"
          >
            <SvgIcon sx={{ height: 20, width: 20 }}>
              <ZunouIcon />
            </SvgIcon>
            <Typography fontSize={14} fontWeight={600}>
              Start New Chat
            </Typography>
          </Button>
          {/* NOTE: Removed in v0.1 */}
          {/* <Divider
            sx={{
              backgroundColor: theme.palette.divider,
              borderColor: theme.palette.divider,
            }}
          />
          <SearchFilter sx={{ width: '100%' }} /> */}
        </Stack>
        <Stack alignItems="center" minHeight={52} overflow="auto">
          {isLoading ? (
            <CircularProgress />
          ) : (
            <ThreadList threads={data?.threads.data} />
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}

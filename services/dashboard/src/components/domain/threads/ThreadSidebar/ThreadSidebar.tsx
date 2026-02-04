import {
  Skeleton,
  // Divider, // NOTE: Removed in v0.1
  SvgIcon,
  Typography,
} from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { useGetThreadsQuery } from '@zunou-queries/core/hooks/useGetThreadsQuery'
import {
  Button,
  // SearchFilter,  // NOTE: Removed in v0.1
} from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useNavigate } from 'react-router-dom'

import ZunouIcon from '~/assets/zunou-icon'
import { ThreadList } from '~/components/domain/threads/ThreadList/ThreadList'
import { useOrganization } from '~/hooks/useOrganization'

interface ThreadSideBarProps {
  openEditThreadModal: (id?: string | null) => void
  openDeleteThreadConfirmationModal: (id?: string | null) => void
}

export const ThreadSidebar = ({
  openEditThreadModal,
  openDeleteThreadConfirmationModal,
}: ThreadSideBarProps) => {
  const { organizationId } = useOrganization()

  const navigate = useNavigate()

  const { data, isLoading } = useGetThreadsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      type: 'admin',
    },
  })

  const handleNewThread = () => {
    navigate(`/organizations/${organizationId}/threads/new`)
  }

  return (
    <Stack
      borderRight={1}
      flexShrink={0}
      sx={{
        bgcolor: 'white',
        borderColor: alpha(theme.palette.primary.main, 0.1),
      }}
      width={296}
    >
      <Stack
        borderBottom={1}
        borderColor={theme.palette.divider}
        padding={2}
        spacing={2}
      >
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
      </Stack>
      <Stack height="100%" overflow="auto" paddingX={1} spacing={4}>
        <Stack alignItems="center" minHeight={52}>
          {isLoading ? (
            <>
              <Skeleton animation="wave" height={42} width="100%" />
              <Skeleton animation="wave" height={42} width="100%" />
              <Skeleton animation="wave" height={42} width="100%" />
            </>
          ) : (
            <ThreadList
              openDeleteThreadConfirmationModal={
                openDeleteThreadConfirmationModal
              }
              openEditThreadModal={openEditThreadModal}
              threads={data?.threads.data}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}

import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { User } from '@zunou-graphql/core/graphql'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { Routes } from '~/services/Routes'
import { extractBetweenPatterns } from '~/utils/extractBetweenPatterns'

import FeedCard from '../components/FeedCard'
import TimeAgo from '../components/TimeAgo'

interface OrganizationChartFeedProps {
  dateString: string
  description: string
  organizationId: string
  pulseId?: string | null
  causer: User | null
}

const OrganizationChartFeed = ({
  dateString,
  description,
  organizationId,
  pulseId = null,
  causer,
}: OrganizationChartFeedProps) => {
  const { userRole } = useAuthContext()
  const navigate = useNavigate()

  const rolePrefix = useMemo(() => userRole?.toLowerCase() ?? '', [userRole])

  const onClickHandler = () => {
    if (!pulseId) {
      toast.error('Missing pulse id')
      return
    }

    navigate(
      `/${rolePrefix}/${pathFor({
        pathname: Routes.OrgChart,
        query: { organizationId, pulseId },
      })}`,
    )
  }

  const pulseName = useMemo(() => {
    return extractBetweenPatterns(
      description,
      'Added a Organization Chart - in ',
      ' the latest team structure. View role, reporting lines, and team groupings',
    )
  }, [description])

  return (
    <FeedCard direction="row" gap={2} onClick={onClickHandler}>
      <Avatar
        placeholder={causer?.name}
        src={causer?.gravatar}
        variant="circular"
      />
      <Stack
        gap={2}
        sx={{
          display: 'inline-block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          verticalAlign: 'bottom',
          wordWrap: 'break-word',
        }}
      >
        <Stack>
          <Typography fontWeight="bold" variant="body1">
            {causer?.name}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Added an{' '}
            <Typography
              color="text.primary"
              component="span"
              fontWeight="bold"
              variant="body2"
            >
              Organization Chart
            </Typography>{' '}
            - in{' '}
            <Typography
              color="text.primary"
              component="span"
              fontWeight="bold"
              variant="body2"
            >
              {pulseName}
            </Typography>{' '}
            the latest team structure. View roles, reporting lines, and team
            groupings.
          </Typography>
        </Stack>
        <TimeAgo dateString={dateString} />
      </Stack>
    </FeedCard>
  )
}

export default OrganizationChartFeed

import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { User } from '@zunou-graphql/core/graphql'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { Routes } from '~/services/Routes'
import { extractBetweenPatterns } from '~/utils/extractBetweenPatterns'

import { MessageContent } from '../../TeamChatPage/components/MessageContent'
import FeedCard from '../components/FeedCard'
import PreviewContainer from '../components/PreviewContainer'
import TimeAgo from '../components/TimeAgo'

interface DMFeedProps {
  messageContent: string
  dateString: string
  description: string
  organizationId: string
  pulseId?: string | null
  causer: User | null
}

const TeamChatFeed = ({
  messageContent,
  dateString,
  description,
  organizationId,
  pulseId = null,
  causer,
}: DMFeedProps) => {
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
        pathname: Routes.PulseTeamChat,
        query: { organizationId, pulseId },
      })}`,
    )
  }

  const pulseName = useMemo(() => {
    return extractBetweenPatterns(description, 'Replied in')
  }, [description])

  return (
    <FeedCard direction="row" gap={2} onClick={onClickHandler}>
      <Avatar
        placeholder={causer?.name}
        src={causer?.gravatar}
        variant="circular"
      />
      <Stack gap={2} width="100%">
        <Stack>
          <Typography fontWeight="bold" variant="body1">
            {causer?.name}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Replied to{' '}
            <Typography
              color="text.primary"
              component="span"
              fontWeight="bold"
              variant="body2"
            >
              {pulseName}
            </Typography>
          </Typography>
        </Stack>
        <PreviewContainer color={theme.palette.error.light}>
          <MessageContent content={messageContent} />
        </PreviewContainer>
        <TimeAgo dateString={dateString} />
      </Stack>
    </FeedCard>
  )
}

export default TeamChatFeed

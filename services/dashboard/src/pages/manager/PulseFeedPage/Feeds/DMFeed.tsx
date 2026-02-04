import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { User } from '@zunou-graphql/core/graphql'
import Avatar from '@zunou-react/components/utility/Avatar'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

import { TeamModal } from '~/components/domain/pulse/TeamModal'

import FeedCard from '../components/FeedCard'
import PreviewContainer from '../components/PreviewContainer'
import TimeAgo from '../components/TimeAgo'

interface DMFeedProps {
  messageContent: string
  dateString: string
  description: string
  causer: User | null
}

const DMFeed = ({ messageContent, dateString, causer }: DMFeedProps) => {
  const [isOpen, setOpen] = useState(false)

  const onClickHandler = () => {
    setOpen(true)
  }

  return (
    <>
      <FeedCard direction="row" gap={2} onClick={onClickHandler}>
        <Avatar
          placeholder={causer?.name}
          src={causer?.gravatar}
          variant="circular"
        />
        <Stack gap={2}>
          <Stack>
            <Typography fontWeight="bold" variant="body1">
              {causer?.name}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Sent you a
              <Typography
                color="text.primary"
                component="span"
                fontWeight="bold"
                variant="body2"
              >
                {' '}
                direct message
              </Typography>
            </Typography>
          </Stack>
          <PreviewContainer color={theme.palette.common.gold}>
            <Markdown rehypePlugins={[rehypeRaw]}>{messageContent}</Markdown>
          </PreviewContainer>

          <TimeAgo dateString={dateString} />
        </Stack>
      </FeedCard>
      <TeamModal
        handleClose={() => setOpen(false)}
        initialSelectedMember={causer}
        isLoading={false}
        isOpen={isOpen}
        noBackBtn={true}
        pulse={null}
        pulseMembers={[]}
      />
    </>
  )
}

export default DMFeed

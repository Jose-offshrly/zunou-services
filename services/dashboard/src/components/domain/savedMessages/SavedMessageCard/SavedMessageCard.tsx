import { BookmarkBorderOutlined } from '@mui/icons-material'
import { CardActionArea, Stack, Typography } from '@mui/material'
import { Card } from '@zunou-react/components/layout'

import { usePulseStore } from '~/store/usePulseStore'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import { MessageContent } from '../../threads/MessageListV2/components/MessageContent'
import { useContentParser } from '../../threads/MessageListV2/hooks/useContentParser'

interface SavedMessageCardProps {
  content: string
  date: string
  name: string
  onClick: () => void
}

export const SavedMessageCard = ({
  content,
  date,
  onClick,
  name,
}: SavedMessageCardProps) => {
  const { activeThreadId } = usePulseStore()
  const { parseContent } = useContentParser()

  const parsedContent = parseContent(content)

  return (
    <Card
      onClick={onClick}
      sx={{
        '&:hover': {
          bgcolor: 'grey.50',
        },
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2,
        mb: 1,
      }}
    >
      <CardActionArea>
        <Stack
          alignItems="flex-start"
          direction="row"
          padding={1.5}
          spacing={1}
        >
          <BookmarkBorderOutlined
            sx={{
              color: 'secondary.main',
              fontSize: 20,
            }}
          />

          <Stack gap={2}>
            <Stack
              sx={{
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 4,
                display: '-webkit-box',
                overflow: 'hidden',
              }}
            >
              <MessageContent
                disableInteraction={true}
                isTruncate={true}
                parsedContent={parsedContent}
                showTextOnly={true}
                threadId={activeThreadId}
              />
            </Stack>

            <Stack alignItems="center" direction="row" spacing={1}>
              <Typography
                sx={{
                  color: 'secondary.main',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                }}
              >
                {name}
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                •
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                }}
              >
                {formatDateAndTime(date)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  )
}

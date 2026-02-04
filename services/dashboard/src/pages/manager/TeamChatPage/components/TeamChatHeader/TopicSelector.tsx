import { ArrowDropDown, ChevronRight } from '@mui/icons-material'
import {
  alpha,
  ButtonGroup,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { Button } from '@zunou-react/components/form/Button'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import UnreadCounter from '~/components/layouts/MainLayout/components/UnreadCounter'

interface SimpleTopic {
  id: string
  name: string
  hasUnread: boolean
  unreadCount?: number
}

interface TopicSelectorProps {
  currentTopic: SimpleTopic
  totalUnreadCount: number
  inlineRecentTopics: SimpleTopic[]
  onGeneralClick: () => void
  onMainButtonClick: (event: React.MouseEvent<HTMLElement>) => void
  onTopicSelectorClick: (event: React.MouseEvent<HTMLElement>) => void
  onInlineTopicClick: (topic: SimpleTopic) => (e: React.MouseEvent) => void
}

export const TopicSelector = ({
  currentTopic,
  inlineRecentTopics,
  totalUnreadCount,
  onGeneralClick,
  onMainButtonClick,
  onTopicSelectorClick,
  onInlineTopicClick,
}: TopicSelectorProps) => {
  const { t } = useTranslation('topics')

  // detects when the topic list becomes scrollable to center the chips
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current
        setIsScrollable(scrollWidth > clientWidth)
      }
    }

    checkScrollable()
    window.addEventListener('resize', checkScrollable)
    return () => window.removeEventListener('resize', checkScrollable)
  }, [inlineRecentTopics])

  return (
    <Stack
      alignItems="center"
      direction="row"
      spacing={1}
      sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}
    >
      <Typography
        onClick={onGeneralClick}
        sx={{
          '&:hover': {
            color: theme.palette.primary.main,
          },
          backgroundColor:
            currentTopic.id === 'general'
              ? alpha(theme.palette.primary.main, 0.05)
              : 'transparent',
          borderRadius: 1,
          color:
            currentTopic.id === 'general'
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
          cursor: 'pointer',
          fontSize: 'small',
          fontWeight:
            currentTopic.id === 'general'
              ? theme.typography.fontWeightBold
              : null,
          padding: '2px 8px',
        }}
        variant="body2"
      >
        # {t('general')}
      </Typography>

      <ChevronRight
        sx={{
          color: theme.palette.text.secondary,
          fontSize: 'small',
        }}
      />

      <ButtonGroup
        sx={{
          border: `0.5px solid ${theme.palette.divider}`,
          borderRadius: 1,
        }}
        variant="outlined"
      >
        <Button
          onClick={onMainButtonClick}
          sx={
            currentTopic.id === 'general'
              ? {
                  border: `0.5px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  cursor: 'pointer',
                  minWidth: 'auto',
                  padding: '4px 12px',
                }
              : {
                  '&:hover': {
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'default',
                  },
                  border: 'none',
                  minWidth: 'auto',
                  padding: '4px 12px',
                }
          }
        >
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="center"
            spacing={1}
            sx={
              currentTopic.id !== 'general'
                ? {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    border: 'none',
                    borderRadius: 1,
                    cursor: 'default',
                    height: 'auto',
                    padding: '2px 8px',
                  }
                : {}
            }
          >
            <Typography
              sx={
                currentTopic.id === 'general'
                  ? { color: theme.palette.text.primary, fontSize: 'small' }
                  : { color: theme.palette.primary.main, fontSize: 'small' }
              }
            >
              {currentTopic.id === 'general' ? '+' : '#'}
            </Typography>
            <Typography
              sx={{
                ...(currentTopic.id === 'general'
                  ? {
                      color: theme.palette.text.primary,
                      fontFamily: theme.typography.fontFamily,
                      fontSize: 'small',
                    }
                  : {
                      color: theme.palette.primary.main,
                      fontSize: 'small',
                      fontWeight: theme.typography.fontWeightBold,
                    }),
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentTopic.id === 'general'
                ? t('add_topics')
                : currentTopic.name}
            </Typography>
          </Stack>
        </Button>
        <Divider
          orientation="vertical"
          sx={{ height: '28px', margin: '0 4px' }}
        />
        <Button
          onClick={onTopicSelectorClick}
          size="small"
          sx={{
            border: `0.5px solid ${theme.palette.divider}`,
            borderRadius: 1,
            gap: 1,
            minWidth: 'auto',
            padding: '4px 8px',
          }}
        >
          <ArrowDropDown
            sx={{
              color: theme.palette.text.secondary,
              fontSize: 'small',
            }}
          />
          <UnreadCounter unread={totalUnreadCount} />
        </Button>
      </ButtonGroup>

      {inlineRecentTopics.length > 0 && (
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
          sx={{
            flex: 1,
            minWidth: 0,
            ml: 2,
            overflow: 'hidden',
          }}
        >
          <Typography
            sx={{
              color: theme.palette.text.secondary,
              flexShrink: 0,
              fontSize: 'small',
              fontWeight: theme.typography.fontWeightMedium,
            }}
          >
            {t('recent')}
          </Typography>
          <Stack
            alignItems="center"
            direction="row"
            ref={scrollContainerRef}
            spacing={1}
            sx={{
              '&:hover': {
                scrollbarColor: `${alpha(theme.palette.grey[400], 0.3)} ${alpha(theme.palette.grey[300], 0.2)}`,
              },
              flex: 1,
              flexWrap: 'nowrap',
              minWidth: 0,
              overflowX: 'auto',

              pt: isScrollable ? 1 : 0,
              scrollbarColor: 'transparent transparent', // this hides the scrollbar when not hovered
              scrollbarWidth: 'thin',
            }}
          >
            {inlineRecentTopics.map((topic) => {
              const unreadCount = topic.unreadCount ?? (topic.hasUnread ? 1 : 0)
              return (
                <Chip
                  key={topic.id}
                  label={
                    <Stack
                      alignItems="center"
                      direction="row"
                      justifyContent="center"
                      spacing={1}
                    >
                      <Typography
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: 'small',
                        }}
                      >
                        #
                        <span
                          style={{
                            color: theme.palette.text.primary,
                            marginLeft: '4px',
                          }}
                        >
                          {topic.name}
                        </span>
                      </Typography>
                      {unreadCount > 0 && (
                        <UnreadCounter unread={unreadCount ?? 0} />
                      )}
                    </Stack>
                  }
                  onClick={onInlineTopicClick(topic)}
                  sx={{
                    '& .MuiChip-label': {
                      padding: 0,
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    },
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    border: 'none',
                    borderRadius: 1,
                    cursor: 'pointer',
                    flexShrink: 0,
                    height: 'auto',
                    padding: '2px 8px',
                  }}
                />
              )
            })}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}

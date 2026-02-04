import { Add } from '@mui/icons-material'
import {
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  Stack,
  Typography,
} from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'

import UnreadCounter from '~/components/layouts/MainLayout/components/UnreadCounter'

import { TopicCreationForm } from '../TopicCreationForm/TopicCreationForm'

interface SimpleTopic {
  id: string
  name: string
  hasUnread: boolean
  unreadCount?: number
}

interface TopicsMenuProps {
  anchorEl: HTMLElement | null
  menuContent: 'topics' | 'create'
  displayedTopics: SimpleTopic[]
  isCreatingTopic: boolean
  onClose: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onNewTopicClick: (event?: React.MouseEvent<HTMLElement>) => void
  onTopicClick: (topic: SimpleTopic) => (e: React.MouseEvent) => void
  onSeeAllTopicsClick: (e: React.MouseEvent) => void
  onCancelCreateTopic: () => void
  onSubmitCreateTopic: (data: { title: string }) => void
}

export const TopicsMenu = ({
  anchorEl,
  menuContent,
  displayedTopics,
  isCreatingTopic,
  onClose,
  onMouseDown,
  onNewTopicClick,
  onTopicClick,
  onSeeAllTopicsClick,
  onCancelCreateTopic,
  onSubmitCreateTopic,
}: TopicsMenuProps) => {
  const { t } = useTranslation('topics')
  const open = Boolean(anchorEl)

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'bottom',
      }}
      autoFocus={false}
      onClose={onClose}
      onMouseDown={onMouseDown}
      open={open}
      slotProps={{
        paper: {
          style: {
            maxWidth: '100%',
            minWidth: 200,
            padding: '4px',
          },
        },
      }}
    >
      {menuContent === 'create' ? (
        <TopicCreationForm
          cancelButtonText={t('cancel')}
          isLoading={isCreatingTopic}
          onCancel={onCancelCreateTopic}
          onSubmit={onSubmitCreateTopic}
          placeholder={t('topic_title')}
          submitButtonText={t('create')}
        />
      ) : (
        [
          <ListItem
            disablePadding={true}
            key="new-topic-item"
            sx={{ width: '100%' }}
          >
            <ListItemButton
              onClick={onNewTopicClick}
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0px',
                width: '100%',
              }}
            >
              <ListItemText
                disableTypography={true}
                primary={
                  <Typography
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: 'small',
                      fontWeight: theme.typography.fontWeightMedium,
                      textAlign: 'center',
                      width: '100%',
                    }}
                  >
                    <Add sx={{ fontSize: '12px', marginRight: '4px' }} />
                    {t('new_topic')}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>,

          <Divider key="divider-1" sx={{ margin: '4px 0' }} />,

          <Stack key="recent-topics-header" sx={{ padding: '8px 16px 4px' }}>
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {t('recent_topics')}
            </Typography>
          </Stack>,

          <Stack key="topics-list" sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {displayedTopics.length === 0 ? (
              <ListItem disablePadding={true}>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: 'small',
                        fontStyle: 'italic',
                        padding: '16px',
                        textAlign: 'center',
                      }}
                    >
                      No topics yet
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              displayedTopics.map((topic) => (
                <ListItem disablePadding={true} key={topic.id}>
                  <ListItemButton
                    onClick={onTopicClick(topic)}
                    sx={{ pr: 1, py: 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 'unset', mr: 1 }}>
                      <Typography
                        sx={{
                          color: topic.hasUnread
                            ? theme.palette.secondary.main
                            : theme.palette.text.secondary,
                          fontSize: 'small',
                          fontWeight: 700,
                        }}
                      >
                        #
                      </Typography>
                    </ListItemIcon>
                    <Stack sx={{ minWidth: 0 }} width="100%">
                      <ListItemText
                        primary={topic.name}
                        primaryTypographyProps={{
                          color: theme.palette.text.primary,
                          fontSize: 'small',
                          sx: {
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    </Stack>
                    <UnreadCounter unread={topic.unreadCount ?? 0} />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </Stack>,

          <Divider key="divider-2" sx={{ margin: '4px 0' }} />,
          <ListItem
            disablePadding={true}
            key="see-all-item"
            sx={{ width: '100%' }}
          >
            <ListItemButton
              onClick={onSeeAllTopicsClick}
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0px',
                width: '100%',
              }}
            >
              <ListItemText
                disableTypography={true}
                primary={
                  <Typography
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: 'small',
                      fontWeight: theme.typography.fontWeightMedium,
                      textAlign: 'center',
                      width: '100%',
                    }}
                  >
                    {t('see_all_topics')}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>,
        ]
      )}
    </Menu>
  )
}

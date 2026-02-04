import { ChatOutlined } from '@mui/icons-material'
import { Divider, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import { User, UserPresence } from '@zunou-graphql/core/graphql'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'

import { TeamModal } from '~/components/domain/pulse/TeamModal'
import { WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { Widget } from '~/components/domain/vitals/widgets/Widget/Widget'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { usePresence } from '~/hooks/usePresence'

import ActionButton from '../ActionButton'
import EmptyWidgetPlaceholder from '../EmptyWidgetPlaceholder'
import DirectMessage from './components/DirectMessage'
import { useHooks } from './useHooks'

interface DMChatWidgetProps {
  widgetId: string
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
}

// Zustand store for DMChatWidget modal control
interface DMChatWidgetState {
  isOpen: boolean
  selectedUser: User | null
  openModal: (user: User) => void
  closeModal: () => void
}

export const useDMChatWidgetStore = create<DMChatWidgetState>((set) => ({
  closeModal: () => set({ isOpen: false, selectedUser: null }),
  isOpen: false,
  openModal: (user) => set({ isOpen: true, selectedUser: user }),
  selectedUser: null,
}))

export const DMChatWidget: React.FC<DMChatWidgetProps> = ({
  widgetId,
  isExpanded,
  onExpand,
}) => {
  const { t } = useTranslation('vitals')
  const { organizationId } = useOrganization()
  // Zustand store state
  const {
    isOpen: isOpenStore,
    selectedUser: selectedUserStore,
    closeModal: closeModalStore,
  } = useDMChatWidgetStore()

  const {
    isDirectMessagesLoading,
    unreadMessages,
    readMessages,
    orgUsers,
    isLoadingOrganizationUsers,
  } = useHooks()

  const userIds = useMemo(
    () => orgUsers?.map((user) => user.id) ?? [],
    [orgUsers],
  )
  const presenceMap = usePresence(userIds)

  // Local state for fallback (e.g. new message button)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [listMode, setListMode] = useState(false)

  const queryClient = useQueryClient()

  const handleModalClose = () => {
    closeModalStore()
    setModalOpen(false)
    setSelectedUser(null)
    setListMode(false)
  }

  const { setting } = useVitalsContext()
  const isDarkMode = setting.theme === 'dark'

  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 700))
  }

  const handleMessageClick = (userId: string) => {
    const user = orgUsers?.find((user) => user.id === userId)
    if (!user) return
    queryClient.invalidateQueries({
      queryKey: ['directMessages', organizationId],
    })
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleNewMessage = () => {
    setModalOpen(true)
    setSelectedUser(null)
    setListMode(true)
  }

  // Modal open state: true if either local or store is true
  const isOpen = isModalOpen || isOpenStore
  // Selected user: store takes precedence
  const selected = selectedUserStore ?? selectedUser

  return (
    <>
      <Widget
        actions={
          <ActionButton
            handleClick={handleNewMessage}
            text={t('new_message')}
          />
        }
        id={WidgetKeysEnum.DMChat}
        isExpanded={isExpanded}
        isLoading={isDirectMessagesLoading}
        name={t('dm_chat')}
        onExpand={onExpand}
        onRefresh={handleRefresh}
        widgetId={widgetId}
      >
        <Stack
          divider={<Divider />}
          spacing={0}
          sx={{ overflow: 'hidden', width: '100%' }}
        >
          {unreadMessages.length > 0 && (
            <>
              {unreadMessages.map((message) => {
                const latestMessage =
                  message.directMessages?.[message.directMessages.length - 1]
                const user = message.otherParticipant
                if (!latestMessage || !user) return null
                return (
                  <DirectMessage
                    content={latestMessage.content}
                    handleMessageClick={() => handleMessageClick(user.id)}
                    id={message.id}
                    isRead={latestMessage.isRead}
                    key={message.id}
                    latestMessageSenderId={latestMessage.sender.id}
                    name={user.name}
                    presence={
                      presenceMap[user.id] ||
                      user.presence ||
                      UserPresence.Offline
                    }
                    profile={user.gravatar}
                    timestamp={new Date(latestMessage.createdAt)}
                  />
                )
              })}
            </>
          )}
          {readMessages.length > 0 && (
            <>
              {unreadMessages.length > 0 && (
                <Typography
                  fontSize="12px"
                  fontWeight="bold"
                  sx={{
                    color: isDarkMode ? 'common.white' : 'common.black',
                    padding: 1,
                  }}
                >
                  {t('all_convos')}
                </Typography>
              )}
              {readMessages.map((message) => {
                const latestMessage =
                  message.directMessages?.[message.directMessages.length - 1]
                const user = message.otherParticipant
                if (!latestMessage || !user) return null
                return (
                  <DirectMessage
                    content={latestMessage.content}
                    handleMessageClick={() => handleMessageClick(user.id)}
                    id={message.id}
                    isRead={latestMessage.isRead}
                    key={message.id}
                    latestMessageSenderId={latestMessage.sender.id}
                    name={user.name}
                    presence={
                      presenceMap[user.id] ||
                      user.presence ||
                      UserPresence.Offline
                    }
                    profile={user.gravatar}
                    timestamp={new Date(latestMessage.createdAt)}
                  />
                )
              })}
            </>
          )}
        </Stack>
        {unreadMessages.length === 0 && readMessages.length === 0 && (
          <EmptyWidgetPlaceholder
            content={t('no_direct_msgs')}
            icon={ChatOutlined}
          />
        )}
      </Widget>
      {(selected || listMode) && (
        <TeamModal
          handleClose={handleModalClose}
          initialSelectedMember={selected}
          isLoading={isLoadingOrganizationUsers}
          isOpen={isOpen}
          pulse={null}
          pulseMembers={orgUsers ?? []}
          vitalsMode={true}
        />
      )}
    </>
  )
}

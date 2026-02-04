import { Close, MessageOutlined } from '@mui/icons-material'
import { Drawer, IconButton, Stack, Typography } from '@mui/material'
import { SavedMessage } from '@zunou-graphql/core/graphql'
import { EmptyState } from '@zunou-react/components/layout/EmptyState'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PulseSourcesDetails } from '~/components/domain/pulse/PulseSourcesDetails/PulseSourcesDetails'
import {
  SavedMessageCard,
  SavedMessageModal,
} from '~/components/domain/savedMessages'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

interface SavedMessagesDrawerProps {
  loading?: boolean
  open: boolean
  onClose: () => void
  savedMessages: SavedMessage[]
}

export type ParsedSavedMessage = SavedMessage & {
  summary: string
  text: string
}

export const SavedMessagesDrawer = ({
  loading,
  open,
  onClose,
  savedMessages,
}: SavedMessagesDrawerProps) => {
  const { t } = useTranslation(['common', 'pulse'])

  const [selectedMessage, setSelectedMessage] = useState<SavedMessage | null>(
    null,
  )
  const [isDataSourceOpen, setIsDataSourceOpen] = useState<boolean>(false)
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>('')

  const handleCloseSavedMessageModal = () => {
    setSelectedMessage(null)
  }

  const handleCardClick = (selectedSavedMessage: SavedMessage) => {
    setSelectedMessage(selectedSavedMessage)
  }

  return (
    <Drawer
      PaperProps={{
        sx: {
          width: 400,
        },
      }}
      anchor="right"
      onClose={onClose}
      open={open}
    >
      <Stack
        padding={3}
        spacing={2}
        sx={{
          '&::-webkit-scrollbar': { display: 'none' },
          height: '100%',
          msOverflowStyle: 'none',
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography fontWeight="bold" variant="h6">
            {t('saved_messages')}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>

        <Stack spacing={2}>
          {loading ? (
            <LoadingSkeleton height={96} variant="rounded" />
          ) : savedMessages.length > 0 ? (
            savedMessages.map((savedMessage) => {
              const { created_at, id, thread, data } = savedMessage

              return (
                <SavedMessageCard
                  content={data.content}
                  date={created_at}
                  key={id}
                  name={thread?.pulse?.name ?? ''}
                  onClick={() => {
                    handleCardClick(savedMessage)
                  }}
                />
              )
            })
          ) : (
            <EmptyState
              hasNoAccess={true}
              icon={<MessageOutlined fontSize="small" />}
              message={t('no_saved_messages', { ns: 'pulse' })}
            />
          )}
        </Stack>
      </Stack>
      <SavedMessageModal
        isOpen={!!selectedMessage}
        onClose={handleCloseSavedMessageModal}
        onDataSourceClick={(dataSourceId: string) => {
          setSelectedDataSourceId(dataSourceId)
          setIsDataSourceOpen(true)
        }}
        savedMessage={selectedMessage}
      />
      {isDataSourceOpen && (
        <PulseSourcesDetails
          dataSourceId={selectedDataSourceId}
          isOpen={isDataSourceOpen}
          onClose={() => {
            setIsDataSourceOpen(false)
          }}
        />
      )}
    </Drawer>
  )
}

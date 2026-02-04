import { ContentCopyOutlined, DeleteOutline } from '@mui/icons-material'
import { Divider, Stack } from '@mui/material'
import { DataSourceOrigin } from '@zunou-graphql/core/graphql'
import { useGetDataSourceQuery } from '@zunou-queries/core/hooks/useGetDataSourceQuery'
import { useGetTranscript } from '@zunou-queries/core/hooks/useGetTranscript'
import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { CustomModal } from '~/components/ui/CustomModal'
import { useOrganization } from '~/hooks/useOrganization'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import { DeleteDataSourceModalContent } from '../DataSourceSidebar/hooks'
import Actionables from './components/Actionables'
import Notes from './components/Notes'
import SummaryNavigation, { SummaryTab } from './components/SummaryNavigation'
import Transcript from './components/Transcript'

export interface ParsedMeetingSummary {
  id: string
  title: string
  date: string
  overview: string[]
  keywords: string[]
  strategies: string[]
  attendees: string[]
}

interface MeetingDetailsProps {
  dataSourceId: string
  pulseIdProp?: string
  isOpen: boolean
  onClose: () => void
  onDelete: (content: DeleteDataSourceModalContent) => void
}

export const MeetingDetails = ({
  dataSourceId,
  pulseIdProp, // used when calling meetiing details outside of pulse context
  isOpen,
  onClose,
  onDelete,
}: MeetingDetailsProps) => {
  const { t } = useTranslation('sources')
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()

  // const [showSpeakerTagsEditor, setShowSpeakerTagsEditor] = useState(false)

  const [selectedTab, setSelectedTab] = useState<SummaryTab>(
    SummaryTab.Highlight,
  )

  const { data: dataSourceData, isLoading: isLoadingDataSource } =
    useGetDataSourceQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        dataSourceId,
        organizationId,
        pulseId: pulseId ?? pulseIdProp,
      },
    })

  const { data: transcriptData, isLoading: isTranscriptLoading } =
    useGetTranscript({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        dataSourceId,
      },
    })

  // DISABLE Human in the loop for now
  // const humanInTheLoopMutation = useHumanInTheLoopMutation({
  //   coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  // })

  // const handleSpeakerMappingSave = (mappings: UserSpeakerMapInput[]) => {
  //   if (!transcriptData?.transcript) return
  //
  //   humanInTheLoopMutation.mutate(
  //     {
  //       bot_meeting_id:
  //         transcriptData.transcript.meeting?.meetingSession?.meetingId || '',
  //       maps: mappings.map((mapping) => ({
  //         speaker: mapping.speaker,
  //         user_name: mapping.user_name,
  //       })),
  //       transcript_id: transcriptData.transcript.id,
  //     },
  //     {
  //       onError: () => {
  //         toast.success('Could not save mapping. Please try again.')
  //       },
  //       onSuccess: async () => {
  //         toast.success('Mapping saved!')
  //         setShowSpeakerTagsEditor(false)
  //         await queryClient.invalidateQueries({
  //           queryKey: ['transcript'],
  //         })
  //       },
  //     },
  //   )
  // }

  const dataSource = dataSourceData?.dataSource

  const parsedSummary = useMemo(() => {
    if (!dataSource?.summary) return null

    try {
      return JSON.parse(dataSource.summary) as ParsedMeetingSummary
    } catch (error) {
      console.error('Failed to parse meeting summary:', error)
      return null
    }
  }, [dataSource?.summary])

  const handleCopy = async () => {
    if (!parsedSummary) {
      toast.error(t('copy_meeting_details_error'))
      return
    }

    try {
      const { overview, strategies } = parsedSummary

      const formattedText = [
        'Overview:',
        ...overview.map((item) => `• ${item}`),
        '\nStrategies:',
        ...strategies.map((item) => `• ${item}`),
      ].join('\n')

      await navigator.clipboard.writeText(formattedText)
      toast.success(t('meeting_notes_copied'))
    } catch (err) {
      toast.error(t('meeting_notes_copy_failed'))
      console.error('Failed to copy meeting overview:', err)
    }
  }

  const handleDelete = () => {
    if (!dataSource) return null

    const { id, name, updatedAt, meeting, origin } = dataSource

    onDelete({
      id,
      metadata:
        origin === DataSourceOrigin.Custom
          ? `Updated: ${formatDateAndTime(updatedAt)}`
          : formatDateAndTime(meeting?.date ?? ''),
      name,
    })
    onClose()
  }

  const handleSelectTab = (newValue: SummaryTab) => setSelectedTab(newValue)

  return (
    <CustomModal
      headerActions={[
        {
          icon: ContentCopyOutlined,
          onClick: handleCopy,
        },
        {
          icon: DeleteOutline,
          onClick: handleDelete,
        },
      ]}
      isOpen={isOpen}
      maxWidth={1200}
      onClose={onClose}
      title={t('meeting_overview')}
    >
      <Stack gap={2} height="100%">
        {!isLoadingDataSource && (
          <SummaryNavigation onChange={handleSelectTab} value={selectedTab} />
        )}
        <Stack height="100%" overflow="auto" p={2}>
          {selectedTab === SummaryTab.Highlight && (
            <Notes
              dataSource={dataSource}
              isLoadingDataSource={isLoadingDataSource}
              onCreateTasks={onClose}
              parsedSummary={parsedSummary}
            />
          )}

          {selectedTab === SummaryTab.Transcript && (
            <Stack
              direction="row"
              divider={<Divider flexItem={true} orientation="vertical" />}
              spacing={2}
            >
              <Stack flex={1}>
                <Transcript
                  dataSourceId={dataSource?.id}
                  date={parsedSummary?.date}
                  isTranscriptLoading={isTranscriptLoading}
                  name={dataSource?.name}
                  transcript={transcriptData?.transcript}
                />
              </Stack>
              {/* {showSpeakerTagsEditor && ( */}
              {/*   <Stack flex="1"> */}
              {/*     <SpeakerTagsEditor */}
              {/*       initialMapping={ */}
              {/*         transcriptData?.transcript.speakers['maps'] ?? {} */}
              {/*       } */}
              {/*       isSaving={humanInTheLoopMutation.isPending} */}
              {/*       onSave={handleSpeakerMappingSave} */}
              {/*       setShowSpeakerTagsEditor={setShowSpeakerTagsEditor} */}
              {/*       speakers={ */}
              {/*         transcriptData?.transcript.speakers['speakers'] ?? [] */}
              {/*       } */}
              {/*     /> */}
              {/*   </Stack> */}
              {/* )} */}
            </Stack>
          )}

          {selectedTab === SummaryTab.Actionables && (
            <Actionables
              eventId={
                dataSource?.meeting?.meetingSession?.event_id ?? undefined
              }
              organizationId={organizationId}
              pulseId={pulseId ?? pulseIdProp}
            />
          )}
        </Stack>
      </Stack>
    </CustomModal>
  )
}

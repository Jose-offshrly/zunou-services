import { Divider, Stack } from '@mui/material'
import { useGetDataSourceQuery } from '@zunou-queries/core/hooks/useGetDataSourceQuery'
import { useGetTranscript } from '@zunou-queries/core/hooks/useGetTranscript'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'

import { DeleteDataSourceModalContent } from '../../dataSource/DataSourceSidebar/hooks'
import Actionables from '../../dataSource/MeetingDetails/components/Actionables'
import Insights from '../../dataSource/MeetingDetails/components/Insights'
import Notes from '../../dataSource/MeetingDetails/components/Notes'
import Strategies from '../../dataSource/MeetingDetails/components/Strategies'
import SummaryNavigation, {
  SummaryTab,
} from '../../dataSource/MeetingDetails/components/SummaryNavigation'
import Transcript from '../../dataSource/MeetingDetails/components/Transcript'

export interface ParsedMeetingSummary {
  id: string
  title: string
  date: string
  overview: string[]
  keywords: string[]
  strategies: string[]
  attendees: string[]
}

interface Props {
  dataSourceId: string
  pulseIdProp?: string
  onClose: () => void
  onDelete?: (content: DeleteDataSourceModalContent) => void
}

export const PostEvent = ({
  dataSourceId,
  pulseIdProp, // used when calling meetiing details outside of pulse context
  onClose,
  //   onDelete,
}: Props) => {
  //   const { t } = useTranslation('sources')
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

  //   const handleCopy = async () => {
  //     if (!parsedSummary) {
  //       toast.error(t('copy_meeting_details_error'))
  //       return
  //     }

  //     try {
  //       const { overview, strategies } = parsedSummary

  //       const formattedText = [
  //         'Overview:',
  //         ...overview.map((item) => `• ${item}`),
  //         '\nStrategies:',
  //         ...strategies.map((item) => `• ${item}`),
  //       ].join('\n')

  //       await navigator.clipboard.writeText(formattedText)
  //       toast.success(t('meeting_notes_copied'))
  //     } catch (err) {
  //       toast.error(t('meeting_notes_copy_failed'))
  //       console.error('Failed to copy meeting overview:', err)
  //     }
  //   }

  //   const handleDelete = () => {
  //     if (!dataSource) return null

  //     const { id, name, updatedAt, meeting, origin } = dataSource

  //     onDelete({
  //       id,
  //       metadata:
  //         origin === DataSourceOrigin.Custom
  //           ? `Updated: ${formatDateAndTime(updatedAt)}`
  //           : formatDateAndTime(meeting?.date ?? ''),
  //       name,
  //     })
  //     onClose()
  //   }

  const handleSelectTab = (newValue: SummaryTab) => setSelectedTab(newValue)

  return (
    <Stack>
      <Stack bgcolor="background.paper" position="sticky" top={0} zIndex={1}>
        {!isLoadingDataSource && (
          <SummaryNavigation onChange={handleSelectTab} value={selectedTab} />
        )}
      </Stack>
      <Stack pt={2}>
        {selectedTab === SummaryTab.Highlight && (
          <Notes
            dataSource={dataSource}
            isLoadingDataSource={isLoadingDataSource}
            onClose={onClose}
            onCreateTasks={onClose}
            onViewAllInsights={() => setSelectedTab(SummaryTab.Insights)}
            parsedSummary={parsedSummary}
          />
        )}

        {selectedTab === SummaryTab.Actionables && (
          <Actionables
            eventId={dataSource?.meeting?.meetingSession?.event_id ?? undefined}
            organizationId={organizationId}
            pulseId={pulseId ?? pulseIdProp}
          />
        )}

        {selectedTab === SummaryTab.Takeaways && (
          <Strategies
            content={parsedSummary?.strategies ?? []}
            isLoading={isLoadingDataSource}
          />
        )}

        {selectedTab === SummaryTab.Insights && <Insights onClose={onClose} />}

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
      </Stack>
    </Stack>
  )
}

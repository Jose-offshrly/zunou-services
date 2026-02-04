import { Stack } from '@mui/system'
import { useGetDataSourceQuery } from '@zunou-queries/core/hooks/useGetDataSourceQuery'
import { Button } from '@zunou-react/components/form'
import {
  AttachmentData,
  AttachmentItem,
} from '@zunou-react/components/form/AttachmentItem'
import FormattedContent, {
  ContentType,
  ParsedContent,
} from '@zunou-react/components/form/FormattedContent'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { PulseSourcesDetails } from '~/components/domain/pulse/PulseSourcesDetails/PulseSourcesDetails'
import { useOrganization } from '~/hooks/useOrganization'

import {
  StrategyModalSection,
  useStrategyManagement,
} from '../MessageStrategySection/MessageStrategySection'

interface MessageResponseProps {
  parsedContent?: ParsedContent
  onAttachmentClick?: (attachment: AttachmentData, type?: ContentType) => void
  isTruncate?: boolean
  showTextOnly?: boolean
}

const MessageResponse = ({
  parsedContent,
  onAttachmentClick,
  isTruncate = false,
  showTextOnly = false,
}: MessageResponseProps) => {
  const [isDataSourceOpen, setIsDataSourceOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<AttachmentData>()
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false)

  const { userRole } = useAuthContext()
  const isManager = userRole === UserRoleEnum.MANAGER
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()

  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>('')

  const { data } = useGetDataSourceQuery(
    useMemo(
      () => ({
        coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
        variables: {
          organizationId,
          pulseId,
          ...(selectedDataSourceId
            ? { dataSourceId: selectedDataSourceId }
            : {}),
        },
      }),
      [selectedDataSourceId, organizationId, pulseId],
    ),
  )

  const { isSubmitting, onSubmit } = useStrategyManagement({
    setIsStrategyModalOpen,
    strategy: parsedContent?.strategy ?? null,
  })

  const formattedContent = useMemo(
    () =>
      (parsedContent?.content || []).filter(
        (item) => item.data_source_id !== 'N/A',
      ),
    [parsedContent],
  )

  const handleAttachmentClick = useCallback(
    (item: AttachmentData, type?: ContentType) => {
      if (
        item.data_source_id &&
        item.data_source_type &&
        ['doc', 'docx', 'pdf'].includes(item.data_source_type)
      ) {
        setSelectedDataSourceId(item.data_source_id)
        const isDataSourceViewable = data?.dataSource.is_viewable

        if (isDataSourceViewable || isManager) {
          setSelectedItem(item)
          setIsDataSourceOpen(true)
        }
        return
      }

      onAttachmentClick?.(item, type)
    },
    [onAttachmentClick, isManager],
  )

  const showStrategySection =
    parsedContent?.title && parsedContent.description && parsedContent.strategy

  return (
    <>
      <Stack
        alignItems="center"
        direction="row"
        gap={1}
        sx={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
      >
        <FormattedContent isTruncate={isTruncate} parsedContent={parsedContent}>
          {!showTextOnly &&
            formattedContent.map((item, index) => (
              <Fragment key={`${item.data_source_id ?? 'none'}-${index}`}>
                <AttachmentItem
                  handleClick={() => handleAttachmentClick(item)}
                  index={index}
                  item={item}
                />
              </Fragment>
            ))}
        </FormattedContent>
        {parsedContent?.type === ContentType.ReviewTasks && (
          <Button
            onClick={() => {
              if (parsedContent.data) {
                handleAttachmentClick(
                  parsedContent.data,
                  ContentType.ReviewTasks,
                )
              }
            }}
            size="large"
            sx={{
              minWidth: 'fit-content',
            }}
            variant="contained"
          >
            Review
          </Button>
        )}
      </Stack>

      {selectedItem?.data_source_id && (
        <PulseSourcesDetails
          dataSourceId={selectedItem.data_source_id}
          isOpen={isDataSourceOpen}
          onClose={() => setIsDataSourceOpen(false)}
          pageNumber={selectedItem.page_number}
          query={selectedItem.text_excerpt}
        />
      )}

      {showStrategySection && (
        <StrategyModalSection
          description={parsedContent.description!}
          isStrategyModalOpen={isStrategyModalOpen}
          isSubmitting={isSubmitting}
          isSuccess={parsedContent.isSuccess!}
          onSubmit={onSubmit}
          prompt_description={parsedContent.prompt_description!}
          setIsStrategyModalOpen={setIsStrategyModalOpen}
          strategy={parsedContent.strategy!}
          title={parsedContent.title!}
        />
      )}
    </>
  )
}

export default MessageResponse

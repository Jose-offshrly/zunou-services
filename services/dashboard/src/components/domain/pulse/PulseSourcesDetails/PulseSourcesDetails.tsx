import { DownloadOutlined } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { useGetDataSourceQuery } from '@zunou-queries/core/hooks/useGetDataSourceQuery'
import { useGetDataSourceUrlQuery } from '@zunou-queries/core/hooks/useGetDataSourceUrlQuery'
import { useGetDownloadDataSourceQuery } from '@zunou-queries/core/hooks/useGetDownloadDataSourceQuery'
import { useParams } from 'react-router-dom'

import DocViewer from '~/components/domain/dataSource/DataSourceDetails/components/DocViewer'
import PdfViewer from '~/components/domain/dataSource/DataSourceDetails/components/PdfViewer'
import { CustomModal } from '~/components/ui/CustomModal'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useOrganization } from '~/hooks/useOrganization'

interface PulseSourceDetailsProps {
  query?: string
  dataSourceId: string
  pageNumber?: number
  isOpen: boolean
  onClose: () => void
}

export const PulseSourcesDetails = ({
  dataSourceId,
  query = '',
  pageNumber,
  isOpen,
  onClose,
}: PulseSourceDetailsProps) => {
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()

  const { data: dataSourceData, isFetching: isFetchingDataSource } =
    useGetDataSourceQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        dataSourceId,
        organizationId,
        pulseId,
      },
    })

  const dataSource = dataSourceData?.dataSource

  const { data: dataSourceUrl, isFetching: isFetchingDataSourceUrl } =
    useGetDataSourceUrlQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { dataSourceId: dataSource?.id },
    })

  const mimeType = dataSourceUrl?.signedDataSourceUrl.mime ?? ''
  const url = dataSourceUrl?.signedDataSourceUrl.url ?? ''

  const { refetch: fetchDownloadUrl } = useGetDownloadDataSourceQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    dataSourceId: dataSource?.id ?? '',
    enabled: false,
  })

  const handleDownload = async () => {
    if (!dataSource) return null

    try {
      const { data } = await fetchDownloadUrl()
      if (data?.downloadDataSource?.url) {
        const link = document.createElement('a')
        link.href = data.downloadDataSource.url
        link.setAttribute('download', dataSource?.name || 'download')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  return (
    <CustomModal
      headerActions={[
        {
          icon: DownloadOutlined,
          onClick: handleDownload,
        },
      ]}
      isOpen={isOpen}
      maxWidth={720}
      onClose={onClose}
      subheader={
        !isFetchingDataSource
          ? `Uploaded on ${dataSource?.updatedAt} | Type ${dataSource?.type.toUpperCase()}`
          : ''
      }
      title={
        isFetchingDataSource ? (
          <LoadingSkeleton height={40} width={240} />
        ) : (
          dataSource?.name
        )
      }
    >
      <Stack justifyContent="space-between" spacing={1}>
        {isFetchingDataSource ? (
          <LoadingSkeleton height={56} />
        ) : (
          <>
            <Typography fontWeight="bold">DESCRIPTION</Typography>
            <Typography color="text.secondary" fontSize={14} fontWeight="400">
              {dataSource?.description}
            </Typography>
          </>
        )}
        {isFetchingDataSourceUrl ? (
          <LoadingSkeleton height={500} />
        ) : (
          (() => {
            const viewerMap: { [key: string]: JSX.Element } = {
              doc: (
                <DocViewer pageNumber={pageNumber} query={query} url={url} />
              ),
              docx: (
                <DocViewer pageNumber={pageNumber} query={query} url={url} />
              ),
              pdf: (
                <PdfViewer pageNumber={pageNumber} query={query} url={url} />
              ),
            }
            return viewerMap[mimeType] || <></>
          })()
        )}
      </Stack>
    </CustomModal>
  )
}

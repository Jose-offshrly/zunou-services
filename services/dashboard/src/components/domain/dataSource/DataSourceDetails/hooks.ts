import { DataSourceOrigin } from '@zunou-graphql/core/graphql'
import { useGetDataSourceQuery } from '@zunou-queries/core/hooks/useGetDataSourceQuery'
import { useGetDataSourceUrlQuery } from '@zunou-queries/core/hooks/useGetDataSourceUrlQuery'
import { useGetDownloadDataSourceQuery } from '@zunou-queries/core/hooks/useGetDownloadDataSourceQuery'
import { useUpdateDataSourceMutation } from '@zunou-queries/core/hooks/useUpdateDataSourceMutation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { zodResolver } from '~/libs/zod'
import {
  UpdateDataSourceParams,
  updateDataSourceSchema,
} from '~/schemas/UpdateDataSourceSchema'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import { DeleteDataSourceModalContent } from '../DataSourceSidebar/hooks'

interface UseDataSourceDetailsProps {
  dataSourceId: string
  onClose: () => void
  onDelete: (content: DeleteDataSourceModalContent) => void
}

export const useHooks = ({
  dataSourceId,
  onClose,
  onDelete,
}: UseDataSourceDetailsProps) => {
  const { t } = useTranslation(['common', 'sources'])
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

  const [isViewable, setIsViewable] = useState(dataSource?.is_viewable ?? false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setIsViewable(dataSource?.is_viewable ?? false)
  }, [dataSource?.is_viewable])

  const { refetch: fetchDownloadUrl } = useGetDownloadDataSourceQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    dataSourceId: dataSourceId ?? '',
    enabled: false,
  })
  const { mutate: updateDataSource, isPending: isPendingUpdateDataSource } =
    useUpdateDataSourceMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const {
    handleSubmit,
    reset,
    control,
    formState: { isValid, errors, touchedFields },
  } = useForm<UpdateDataSourceParams>({
    mode: 'onBlur',
    resolver: zodResolver(updateDataSourceSchema),
    values: {
      description: dataSource?.description ?? '',
      name: dataSource?.name ?? '',
      summary: dataSource?.summary ?? '',
    },
  })

  const { name, description, summary } = useWatch({ control })

  const handleDownload = async () => {
    if (!dataSource) return null

    try {
      const { data } = await fetchDownloadUrl()
      if (data?.downloadDataSource?.url) {
        const link = document.createElement('a')
        link.href = data.downloadDataSource.url
        link.setAttribute('download', dataSource.name || 'download')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  const handleUpdateDataSource = (data: UpdateDataSourceParams) => {
    if (!dataSource?.id || !pulseId) {
      toast.error('Missing required data')
      return
    }

    updateDataSource(
      {
        ...data,
        id: dataSource.id,
        organizationId,
        pulseId,
      },
      {
        onError: () => toast.error('Failed to update data source'),
        onSettled: () => setIsEditing(false),
        onSuccess: () => {
          toast.success('Data source updated successfully')
        },
      },
    )
  }

  const handleToggleViewable = () => {
    const previousViewableState = isViewable

    // Optimisitcally update the UI
    setIsViewable(!isViewable)

    if (!dataSource?.id || !pulseId) {
      toast.error('Missing required data')
      return
    }

    updateDataSource(
      {
        id: dataSourceId,
        is_viewable: !dataSource.is_viewable,
        name: dataSource.name,
        organizationId,
        pulseId,
      },
      {
        onError: () => {
          // Revert the isViewable state on error
          setIsViewable(previousViewableState)
          toast.error('Failed to update data source')
        },
        onSettled: () => setIsEditing(false),
        onSuccess: () => {
          toast.success('Data source updated successfully')
        },
      },
    )
  }

  const handleEdit = () => {
    setIsEditing(true)
    reset()
  }

  const handleClose = () => {
    setIsEditing(false)
    onClose()
  }

  const handleCancel = () => {
    setIsEditing(false)
    reset()
  }

  const handleDelete = () => {
    if (!dataSource) return null

    onDelete({
      id: dataSource.id,
      metadata:
        dataSource.origin === DataSourceOrigin.Custom
          ? `Updated: ${formatDateAndTime(dataSource.updatedAt)}`
          : formatDateAndTime(dataSource.meeting?.date ?? ''),
      name: dataSource.name,
    })
    handleClose()
  }

  const onSubmitHandler = handleSubmit((data: UpdateDataSourceParams) => {
    handleUpdateDataSource(data)
  })

  return {
    control,
    dataSource,
    description,
    errors,
    handleCancel,
    handleClose,
    handleDelete,
    handleDownload,
    handleEdit,
    handleToggleViewable,
    isEditing,
    isFetchingDataSource,
    isFetchingDataSourceUrl,
    isPendingUpdateDataSource,
    isValid,
    isViewable,
    mimeType,
    name,
    onSubmitHandler,
    summary,
    t,
    touchedFields,
    url,
  }
}

import {
  DeleteOutline,
  DownloadOutlined,
  EditOutlined,
} from '@mui/icons-material'
import { CircularProgress, Stack, Switch, Typography } from '@mui/material'
import { TextField } from '@zunou-react/components/form'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useAccessControl } from '~/hooks/useAccessControl'
import { usePulseStore } from '~/store/usePulseStore'
import { PulsePermissionEnum } from '~/types/permissions'

import { DeleteDataSourceModalContent } from '../DataSourceSidebar/hooks'
import DocViewer from './components/DocViewer'
import PdfViewer from './components/PdfViewer'
import { TextFieldSection } from './components/TextFieldSection'
import { useHooks } from './hooks'

interface DataSourceDetailsProps {
  dataSourceId: string
  isOpen: boolean
  onClose: () => void
  onDelete: (content: DeleteDataSourceModalContent) => void
  onToggleViewable: (id: string, is_viewable: boolean) => void
}

export const DataSourceDetails = ({
  dataSourceId,
  isOpen,
  onClose,
  onDelete,
}: DataSourceDetailsProps) => {
  const {
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
  } = useHooks({
    dataSourceId,
    onClose,
    onDelete,
  })
  const { permissions } = usePulseStore()

  const { checkAccess } = useAccessControl()
  const { grant: hasUpdateAccess } = checkAccess(
    [
      PulsePermissionEnum.DELETE_DATA_SOURCE,
      PulsePermissionEnum.UPDATE_DATA_SOURCE,
    ],
    permissions,
  )

  return (
    <CustomModalWithSubmit
      customHeaderActions={
        hasUpdateAccess && (
          <Stack alignItems="center" direction="row" ml={2}>
            <Typography
              fontSize={12}
              fontWeight="400"
              sx={{ color: 'text.primary', ml: 2 }}
            >
              {t('viewable', { ns: 'sources' })}
            </Typography>
            <Switch
              checked={isViewable}
              color="primary"
              onChange={handleToggleViewable}
              size="medium"
            />
          </Stack>
        )
      }
      disabledSubmit={!isValid}
      headerActions={[
        ...(hasUpdateAccess
          ? [
              {
                icon: DeleteOutline,
                onClick: handleDelete,
              },
              {
                icon: EditOutlined,
                onClick: handleEdit,
              },
            ]
          : []),
        {
          icon: DownloadOutlined,
          onClick: handleDownload,
        },
      ]}
      isEditable={isEditing}
      isOpen={isOpen}
      isSubmitting={isPendingUpdateDataSource}
      maxWidth={720}
      onCancel={handleCancel}
      onClose={handleClose}
      onSubmit={onSubmitHandler}
      subheader={
        !isFetchingDataSource &&
        `${t('uploaded_on', { ns: 'sources' })}   ${dataSource?.updatedAt} | ${t('type', { ns: 'sources' })} ${dataSource?.type.toUpperCase()}`
      }
      title={
        !isEditing ? (
          isFetchingDataSource ? (
            <LoadingSkeleton height={40} width={240} />
          ) : (
            dataSource?.name
          )
        ) : (
          <TextField
            control={control}
            error={touchedFields.name ? errors?.name : undefined}
            id="name"
            name="name"
            size="small"
            value={name}
          />
        )
      }
    >
      <Stack justifyContent="space-between" spacing={1}>
        <Typography fontWeight="bold">{t('description')}</Typography>
        <TextFieldSection
          control={control}
          dataSource={dataSource}
          errors={errors}
          fieldName="description"
          isEditing={isEditing}
          isLoading={isFetchingDataSource}
          touchedFields={touchedFields}
          value={description}
        />
        <Typography fontWeight="bold">{t('summary')}</Typography>
        <TextFieldSection
          control={control}
          dataSource={dataSource}
          errors={errors}
          fieldName="summary"
          isEditing={isEditing}
          isLoading={isFetchingDataSource}
          rowCount={5}
          touchedFields={touchedFields}
          value={summary}
        />
        {isFetchingDataSourceUrl ? (
          <Stack
            alignItems="center"
            height={500}
            justifyContent="center"
            width="100%"
          >
            <CircularProgress />
          </Stack>
        ) : (
          (() => {
            const viewerMap: { [key: string]: JSX.Element } = {
              doc: <DocViewer url={url} />,
              docx: <DocViewer url={url} />,
              pdf: <PdfViewer url={url} />,
            }
            return viewerMap[mimeType] || <></>
          })()
        )}
      </Stack>
    </CustomModalWithSubmit>
  )
}

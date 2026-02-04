import { Add, Delete, DescriptionOutlined } from '@mui/icons-material'
import { alpha, Card, CardContent, Stack, Typography } from '@mui/material'
import { FileType } from '@zunou-graphql/core/graphql'
import {
  Button,
  FileUploadField,
  TextField,
} from '@zunou-react/components/form'
import { IconButton } from '@zunou-react/components/form/IconButton'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { PrimaryGhostButton } from '~/components/ui/button/PrimaryGhostButton'
import { CustomModal } from '~/components/ui/CustomModal'

import { DataSource } from '../types'

interface DataCardProps {
  dataSources: DataSource[]
  onUploadData: (
    fileKey: string,
    fileName: string,
    description?: string,
  ) => void
  onRemoveDataSource: (fileKey: string) => void
  organizationId: string
}

export const DataCard = ({
  dataSources,
  onUploadData,
  onRemoveDataSource,
  organizationId,
}: DataCardProps) => {
  const { control, reset, handleSubmit, watch, setValue } = useForm()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const name = watch('name')
  const description = watch('description')
  const fileKey = watch('fileKey')

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    reset()
  }

  const handleOpenUploadModal = () => {
    reset()
    setIsUploadModalOpen(true)
  }

  const onSubmit = handleSubmit((data) => {
    if (data.fileKey && data.name) {
      setIsUploading(true)
      onUploadData(
        data.fileKey as string,
        data.name as string,
        (data.description as string) || undefined,
      )
      handleCloseUploadModal()
      setIsUploading(false)
    }
  })

  return (
    <Card
      sx={{
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 2,
        boxShadow: 'none',
        height: '100%',
        mb: 4,
        position: 'relative',
        width: '100%',
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Typography
            color="text.primary"
            fontWeight="medium"
            sx={{ mb: 2 }}
            variant="h6"
          >
            Data
          </Typography>
          <PrimaryGhostButton
            onClick={handleOpenUploadModal}
            sx={{ height: '32px', width: '32px' }}
          >
            <Add fontSize="small" />
          </PrimaryGhostButton>
        </Stack>

        {dataSources.length > 0 ? (
          <Stack spacing={2}>
            {dataSources.map((dataSource) => (
              <Stack
                alignItems="center"
                direction="row"
                key={dataSource.fileKey}
                sx={{
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Stack flex={1}>
                  <Typography color="text.primary" variant="subtitle1">
                    {dataSource.name}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {dataSource.description}
                  </Typography>
                </Stack>
                <IconButton
                  onClick={() => onRemoveDataSource(dataSource.fileKey)}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Stack
            alignItems="center"
            bgcolor={alpha(theme.palette.primary.main, 0.02)}
            border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}
            borderRadius={2}
            justifyContent="center"
            py={4}
            spacing={2}
            width="100%"
          >
            <Stack
              alignItems="center"
              borderRadius="50%"
              justifyContent="center"
              p={0.5}
            >
              <DescriptionOutlined
                fontSize="medium"
                sx={{ color: theme.palette.text.secondary }}
              />
            </Stack>

            <Typography
              align="center"
              color="text.secondary"
              sx={{ maxWidth: '80%', mb: 3 }}
              variant="body2"
            >
              Enhance this pulse by attaching relevant files—PDFs, .xlsx, or
              .pptx—that provide helpful background, insights, or supporting
              data.
            </Typography>

            <Button
              color="primary"
              onClick={handleOpenUploadModal}
              sx={{ border: `1px solid ${theme.palette.primary.main}` }}
              variant="outlined"
            >
              Upload Supporting Data
            </Button>
          </Stack>
        )}

        <CustomModal
          isOpen={isUploadModalOpen}
          onClose={handleCloseUploadModal}
          subheader="Upload files to enhance your pulse with relevant information and insights."
          title="Upload Supporting Data"
        >
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                control={control}
                label="Name"
                name="name"
                value={name}
              />
              <TextField
                control={control}
                label="Description"
                multiline={true}
                name="description"
                onChangeFilter={(val: string | undefined) =>
                  val ? val : undefined
                }
                rows={4}
                value={description}
              />
              <FileUploadField
                allowedFileTypes={[
                  `.${FileType.Csv}`,
                  `.${FileType.Doc}`,
                  `.${FileType.Docx}`,
                  `.${FileType.Html}`,
                  `.${FileType.Markdown}`,
                  `.${FileType.Pdf}`,
                  `.${FileType.Ppt}`,
                  `.${FileType.Pptx}`,
                  `.${FileType.Rtf}`,
                  `.${FileType.Xls}`,
                  `.${FileType.Xlsx}`,
                ]}
                companionUrl={import.meta.env.VITE_COMPANION_URL}
                control={control}
                coreGraphQLUrl={import.meta.env.VITE_CORE_GRAPHQL_URL}
                label="CSV, Doc, Docx, html, markdown, pdf, ppt, pptx, rtx, xls, xlsx"
                name="fileKey"
                onChange={(fileKey, fileName, uploadState) => {
                  if (fileKey) {
                    setValue('fileKey', fileKey)
                    if (!name) {
                      setValue('name', fileName)
                    }
                  }
                  if (uploadState?.isUploading) {
                    setIsUploading(true)
                  } else {
                    setIsUploading(false)
                  }
                }}
                organizationId={organizationId}
              />
              <Button
                disabled={!name || !fileKey || isUploading}
                sx={{
                  alignSelf: 'flex-end',
                  height: 40,
                  minWidth: 120,
                }}
                type="submit"
                variant="contained"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </Stack>
          </form>
        </CustomModal>
      </CardContent>
    </Card>
  )
}

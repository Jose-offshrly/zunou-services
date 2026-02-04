import { CloudUpload as CloudUploadIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  styled,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const DropZone = styled(Box)<{ isDragActive: boolean }>(
  ({ isDragActive, theme }) => ({
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.02)',
      borderColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.5)'
          : 'rgba(0, 0, 0, 0.3)',
    },
    alignItems: 'center',
    backgroundColor: isDragActive
      ? theme.palette.mode === 'dark'
        ? 'rgba(66, 165, 245, 0.08)'
        : 'rgba(66, 165, 245, 0.04)'
      : 'transparent',
    border: `2px dashed ${isDragActive ? theme.palette.primary.main : '#ccc'}`,
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: theme.spacing(3),
    textAlign: 'center',
    transition: 'all 0.2s ease-in-out',
  }),
)

interface DroppableFileZoneProps {
  onFileSelected: (file: File) => void
  accept?: string
  disabled?: boolean
  externalLoading?: boolean
}

export const DroppableFileZone = ({
  onFileSelected,
  accept = 'image/*',
  disabled = false,
  externalLoading = false,
}: DroppableFileZoneProps) => {
  const { t } = useTranslation('vitals')
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file) return
    onFileSelected(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (disabled) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <DropZone
      isDragActive={isDragActive}
      onClick={() => fileInputRef.current?.click()}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{ opacity: disabled ? 0.6 : 1 }}
    >
      <input
        accept={accept}
        disabled={disabled || externalLoading}
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
      />
      {externalLoading ? (
        <CircularProgress size={28} sx={{ mb: 1 }} />
      ) : (
        <CloudUploadIcon
          color="primary"
          sx={{ fontSize: 40, mb: 1, opacity: 0.8 }}
        />
      )}
      <Typography sx={{ mb: 1 }} variant="body1">
        {t('drag_or_upload_file')}
      </Typography>
      <Button
        disabled={disabled || externalLoading}
        size="small"
        startIcon={<CloudUploadIcon />}
        variant="contained"
      >
        {externalLoading ? 'Processing...' : 'Select File'}
      </Button>
    </DropZone>
  )
}

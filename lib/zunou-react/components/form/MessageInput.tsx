import {
  Article,
  Close,
  Image,
  SendRounded,
  // UploadFile, // NOTE: Not included in v0.1 release
} from '@mui/icons-material'
import {
  Box,
  // Button, // NOTE: Not included in v0.1 release
  CircularProgress,
  darken,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
// import { styled } from '@mui/system' // NOTE: Not included in v0.1 release
import AwsS3 from '@uppy/aws-s3'
import Uppy from '@uppy/core'
import { generateLiveUploadCredentialsMutation } from '@zunou-queries/core/mutations/generateLiveUploadCredentialsMutation'
// import { createLiveUploadMutation } from '@zunou-queries/core/mutations/createLiveUploadMutation' // NOTE: Not included in v0.1 release
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import {
  UseFormRegister,
  UseFormResetField,
  UseFormSetValue,
} from 'react-hook-form'

import { getFileType } from '../../services/File'
import { formatFileSize } from '../../utils/formatFileSize'

export interface FormValues {
  files?: FileList | null
  message?: string | null
}

interface IMessageInput {
  allowedFileTypes: string[]
  coreGraphQLUrl: string
  files?: FileList | null
  handleSubmit: () => void
  isLoadingSubmission: boolean
  isValid: boolean
  organizationId: string
  register: UseFormRegister<FormValues>
  resetField: UseFormResetField<FormValues>
  setValue: UseFormSetValue<FormValues>
  threadId?: string
  token?: string | null
}

interface IFileDetails {
  name: string
  type: string
  size: number
  isLoading: boolean
}

/** NOTE: Not included in v0.1 release */
// const VisuallyHiddenInput = styled('input')({
//   bottom: 0,
//   clip: 'rect(0 0 0 0)',
//   clipPath: 'inset(50%)',
//   height: 1,
//   left: 0,
//   overflow: 'hidden',
//   position: 'absolute',
//   whiteSpace: 'nowrap',
//   width: 1,
// })

const FileDetails = ({ name, type, size, isLoading }: IFileDetails) => {
  const lastDotIndex = name.lastIndexOf('.')
  const filename = lastDotIndex !== -1 ? name.slice(0, lastDotIndex) : name
  const extension = lastDotIndex !== -1 ? name.slice(lastDotIndex + 1) : ''

  return (
    <Stack direction="row" overflow="hidden">
      <Box
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          display: 'flex',
          height: 40,
          justifyContent: 'center',
          marginRight: 1,
          width: 40,
        }}
      >
        {isLoading ? (
          <CircularProgress
            size={36}
            sx={{ color: theme.palette.grey['500'] }}
          />
        ) : type === 'image/png' ? (
          <Image sx={{ height: '100%', width: '100%' }} />
        ) : (
          <Article sx={{ height: '100%', width: '100%' }} />
        )}
      </Box>

      <Stack>
        <Typography fontSize={14} noWrap={true}>
          {filename}.{extension}
        </Typography>
        <Typography color={theme.palette.grey['400']} fontSize={12}>
          {formatFileSize(size)}
        </Typography>
      </Stack>
    </Stack>
  )
}

export const MessageInput = ({
  allowedFileTypes,
  coreGraphQLUrl,
  files,
  handleSubmit,
  isLoadingSubmission,
  isValid,
  organizationId,
  register,
  resetField,
  setValue,
  // threadId, // NOTE: Not included in v0.1 release
  token = null,
}: IMessageInput) => {
  const [isFileUploadInProgress, setIsFileUploadInProgress] = useState(false)
  const [selectedUppyFile, setSelectedUppyFile] = useState<string | null>(null)

  const [uppy] = useState(() =>
    new Uppy({
      autoProceed: true,
      meta: { type: 'live-upload-development' },
      restrictions: {
        allowedFileTypes,
        maxNumberOfFiles: 3,
      },
    })
      .use(AwsS3, {
        getUploadParameters: async (file) => {
          const credentialsPayload = {
            fileType: getFileType(file.extension),
            organizationId,
          }

          const credentials = await generateLiveUploadCredentialsMutation(
            coreGraphQLUrl,
            token,
            credentialsPayload,
          )

          const url = credentials.generateLiveUploadCredentials?.url ?? ''

          return {
            limit: 1,
            method: 'PUT',
            url,
          }
        },
      })
      .on('upload', () => {
        setIsFileUploadInProgress(true)
      })
      .on('complete', () => {
        setIsFileUploadInProgress(false)
      })
      .on('upload-error', (error) => {
        console.log('Upload error: ', error)
      }),
  )

  /** NOTE: Not included in v0.1 release */
  // const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files

  //   if (!files) return

  //   const file = files[0]

  //   const uppyFile = uppy.addFile({
  //     data: file,
  //     isRemote: false,
  //     name: file.name,
  //     source: 'local',
  //     type: file.type,
  //   })

  //   setSelectedUppyFile(uppyFile)
  // }

  const handleRemoveFile = (file: File) => {
    const updatedFiles = new DataTransfer()

    if (files) {
      const fileArray = Array.from(files)
      const filteredFiles = fileArray.filter((f) => f !== file)

      filteredFiles.forEach((f) => updatedFiles.items.add(f))

      if (updatedFiles.files.length <= 0) {
        resetField('files')
        setSelectedUppyFile(null)
      }

      if (selectedUppyFile) {
        uppy.removeFile(selectedUppyFile)
      }

      setValue('files', updatedFiles.files)
    }
  }

  return (
    <Stack
      alignItems="center"
      bottom={12}
      justifyContent="start"
      padding={2}
      position="absolute"
      width="100%"
    >
      {isLoadingSubmission && (
        <LinearProgress
          sx={{ alignSelf: 'center', marginBottom: 2, width: '35%' }}
        />
      )}
      {files && files.length > 0 && (
        <Stack
          spacing={1}
          sx={{
            bgcolor: theme.palette.grey['100'],
            borderRadius: '16px 16px 0 0',
            maxWidth: 560,
            minWidth: 520,
            p: 2,
          }}
        >
          <Stack
            spacing={1}
            sx={{
              maxHeight: 160,
              overflow: 'auto',
            }}
          >
            <Stack spacing={1}>
              {files &&
                Array.from(files).map((file, index) => {
                  return (
                    <Stack
                      bgcolor={theme.palette.common.white}
                      borderRadius={1}
                      direction="row"
                      justifyContent="space-between"
                      key={index}
                      paddingX={1}
                      paddingY={0.5}
                      spacing={1}
                      sx={{
                        alignItems: 'center',
                        maxHeight: 240,
                        overflow: 'auto',
                      }}
                    >
                      <FileDetails
                        isLoading={isFileUploadInProgress}
                        name={file.name}
                        size={file.size}
                        type={file.type}
                      />
                      <IconButton onClick={() => handleRemoveFile(file)}>
                        <Close sx={{ height: 16, width: 16 }} />
                      </IconButton>
                    </Stack>
                  )
                })}
            </Stack>
          </Stack>
        </Stack>
      )}
      <Stack direction="row" left={0} maxWidth={752} spacing={2} width="100%">
        {/* NOTE: Temporarily removed for v0.1  */}
        {/* <Button
          component="label"
          sx={{
            '&:hover': {
              backgroundColor: darken(theme.palette.secondary.main, 0.2),
              boxShadow: 'none',
            },
            backgroundColor: theme.palette.secondary.main,
            borderRadius: 99,
            boxShadow: 'none',
            height: 40,
            minWidth: 40,
            width: 40,
          }}
          variant="contained"
        >
          <UploadFile />
          <VisuallyHiddenInput
            {...register('files', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                handleInputFileChange(e)
              },
            })}
            id="file"
            type="file"
          />
        </Button> */}
        <Stack
          component="form"
          direction="row"
          onSubmit={handleSubmit}
          spacing={2}
          width="100%"
        >
          <TextField
            {...register('message')}
            id="message"
            placeholder="Ask any HR related questions here..."
            size="small"
            sx={{
              '& .MuiInputBase-input::placeholder': {
                color: '#667085',
              },
              backgroundColor: 'white',
              width: '100%',
            }}
          />
          <IconButton
            disabled={!isValid || isFileUploadInProgress}
            onClick={handleSubmit}
            sx={{
              '&.Mui-disabled': {
                backgroundColor: theme.palette.grey['300'],
              },
              '&:hover': {
                backgroundColor: darken(theme.palette.primary.main, 0.2),
              },
              bgcolor: theme.palette.primary.main,
              color: 'white',
            }}
          >
            <SendRounded />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  )
}

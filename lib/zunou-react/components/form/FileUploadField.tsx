import '@uppy/core/dist/style.min.css'
import '@uppy/dashboard/dist/style.min.css'

import {
  alpha,
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
} from '@mui/material'
import AwsS3 from '@uppy/aws-s3'
import { Uppy, UppyFile } from '@uppy/core'
import GoogleDrive from '@uppy/google-drive'
import OneDrive from '@uppy/onedrive'
import { Dashboard } from '@uppy/react'
import { generateUploadCredentialsMutation } from '@zunou-queries/core/mutations/generateUploadCredentialsMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { getFileType } from '@zunou-react/services/File'
import { theme } from '@zunou-react/services/Theme'
import { MutationError } from '@zunou-react/types/graphql'
import { extractS3Path } from '@zunou-react/utils/extractS3Path'
import { useFieldError } from '@zunou-react/utils/useFieldError'
import { useMemo } from 'react'
import {
  Control,
  Controller,
  FieldError,
  FieldValues,
  Path,
} from 'react-hook-form'

interface ExtendedUppyFile extends UppyFile {
  xhrUpload?: {
    endpoint: string
  }
}

export interface FileUploadFieldProps<T extends FieldValues> {
  allowedFileTypes: string[]
  companionUrl: string
  control: Control<T>
  coreGraphQLUrl: string
  error?: MutationError | FieldError | null
  helperText?: string
  label?: string
  name: string
  onChange: (
    value: string,
    originalFileName?: string,
    uploadState?: { isUploading: boolean },
  ) => void
  organizationId: string
}

export function FileUploadField<T extends FieldValues>({
  companionUrl: _companionUrl,
  control,
  allowedFileTypes,
  coreGraphQLUrl,
  error,
  helperText,
  label,
  name,
  onChange,
  organizationId,
}: FileUploadFieldProps<T>) {
  const err = useFieldError({ error, fieldName: name })

  const { getToken } = useAuthContext()

  const uppy = useMemo(() => {
    return new Uppy({
      autoProceed: true,
      meta: { type: 'data-source' },
      restrictions: {
        allowedFileTypes,
        maxNumberOfFiles: 1,
      },
    })
      .use(GoogleDrive, { companionUrl: _companionUrl })
      .use(OneDrive, { companionUrl: _companionUrl })
      .use(AwsS3, {
        getUploadParameters: async (file) => {
          const credentialsPayload = {
            fileType: getFileType(file.extension),
            organizationId,
          }

          const token = await getToken()
          const credentials = await generateUploadCredentialsMutation(
            coreGraphQLUrl,
            token,
            credentialsPayload,
          )
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          const url = credentials.generateUploadCredentials?.url!

          return {
            limit: 1,
            method: 'PUT',
            url,
          }
        },
      })
      .on('file-added', (file) => {
        onChange(file.name, file.name)
      })
      .on('upload', () => {
        onChange('', undefined, { isUploading: true })
      })
      .on('upload-error', (file, error, response) => {
        onChange('', undefined, { isUploading: false })
        console.error('upload-error', file?.id, error, response)
      })
      .on('error', (error) => {
        console.error('error', error)
      })
      .on('complete', (result: { successful: ExtendedUppyFile[] }) => {
        const successfulResult = result.successful[0]
        if (!successfulResult) {
          console.warn('No successful upload result found')
          onChange('', undefined, { isUploading: false })
          return
        }

        const url =
          successfulResult.source === 'GoogleDrive' ||
          successfulResult.source === 'OneDrive'
            ? successfulResult.xhrUpload?.endpoint
            : successfulResult.response?.uploadURL

        if (!url) {
          console.warn(
            `No URL found for ${successfulResult.source || 'local'} file upload`,
          )
          onChange('', undefined, { isUploading: false })
          return
        }

        const fileKey = extractS3Path(url)
        onChange(fileKey, successfulResult.name, { isUploading: false })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coreGraphQLUrl])

  return (
    <Controller
      control={control}
      name={name as Path<T>}
      render={() => {
        return (
          <FormControl
            sx={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              mb: 2,
            }}
            variant="outlined"
          >
            {label ? (
              <FormLabel
                component="label"
                sx={{ fontSize: 12, marginBottom: 1 }}
              >
                {label}
              </FormLabel>
            ) : null}

            {uppy ? (
              <Box
                sx={{
                  '& .uppy-Dashboard': {
                    border: '2px dashed',
                    borderColor: alpha(theme.palette.primary.main, 0.7),
                    borderRadius: 2,
                    boxShadow: 'none',
                    height: '350px',
                    overflow: 'auto',
                  },
                  '& .uppy-Dashboard-AddFiles-title': {
                    '& button': {
                      marginX: 1,
                    },
                    alignItems: 'center',
                    display: 'flex',
                    flex: 1,
                    justifyContent: 'center',
                    lineHeight: 200,
                    maxHeight: '50px',
                  },
                  '& .uppy-Dashboard-inner': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },

                  '& .uppy-DashboardTab-inner': {
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                    borderRadius: '100%',
                    height: 50,
                    width: 50,
                  },
                  '& .uppy-size--md .uppy-Dashboard-AddFiles-list': {
                    marginTop: 0,
                  },
                  '& .uppy-size--md .uppy-Dashboard-AddFiles-title': {
                    '& .uppy-c-btn:not(:disabled):not(.disabled)': {
                      color: 'primary.main',
                      marginLeft: 1,
                      marginRight: 1,
                    },
                    fontSize: 16,
                  },

                  '& .uppy-u-reset.uppy-c-btn.uppy-DashboardTab-btn': {
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  },
                  '[data-uppy-drag-drop-supported=true] .uppy-Dashboard-AddFiles':
                    {
                      border: 'none',
                    },

                  height: '350px',
                  overflowY: 'auto',
                }}
              >
                <Dashboard
                  doneButtonHandler={undefined}
                  height="200"
                  hideProgressAfterFinish={false}
                  proudlyDisplayPoweredByUppy={false}
                  uppy={uppy}
                  width="100%"
                />
              </Box>
            ) : null}

            {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}

            {err ? <FormHelperText error={true}>{err}</FormHelperText> : null}
          </FormControl>
        )
      }}
    />
  )
}

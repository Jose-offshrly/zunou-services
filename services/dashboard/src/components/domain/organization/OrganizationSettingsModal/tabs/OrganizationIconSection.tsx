import { FileUploadOutlined } from '@mui/icons-material'
import {
  Avatar,
  Link,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { Organization, UploadType } from '@zunou-graphql/core/graphql'
import { useGetOrganizationLogoQuery } from '@zunou-queries/core/hooks/useGetOrganizationLogoQuery'
import { useUpdateOrganizationMutation } from '@zunou-queries/core/hooks/useUpdateOrganizationMutation'
import { generateUploadCredentialsMutation } from '@zunou-queries/core/mutations/generateUploadCredentialsMutation'
import { Image } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { getImageFileType } from '@zunou-react/services/File'
import { theme } from '@zunou-react/services/Theme'
import { extractS3Path } from '@zunou-react/utils/extractS3Path'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useOrganization } from '~/hooks/useOrganization'

interface OrganizationIconSectionProps {
  organizationDetails?: Organization | null
}

export const OrganizationIconSection = ({
  organizationDetails,
}: OrganizationIconSectionProps) => {
  const { t } = useTranslation(['common', 'settings'])
  const { organizationId, organization } = useOrganization()
  const { getToken, refetchUser } = useAuthContext()
  const queryClient = useQueryClient()

  const { data: logoData, isFetching: isFetchingLogo } =
    useGetOrganizationLogoQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!organizationId,
      variables: { organizationId },
    })

  const { mutate: updateOrganizationLogo, isPending: isUpdatingOrganization } =
    useUpdateOrganizationMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  // Use temporary S3 URL from query (changes on each fetch) or static URL as fallback
  const logoUrl =
    logoData?.organizationLogo?.url ||
    organizationDetails?.logo ||
    organization?.logo

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const credentialsPayload = {
        fileType: getImageFileType(file.name.split('.').pop() || ''),
        organizationId,
      }

      const token = await getToken()

      const credentials = await generateUploadCredentialsMutation(
        import.meta.env.VITE_CORE_GRAPHQL_URL as string,
        token,
        {
          fileType: credentialsPayload.fileType,
          organizationId: credentialsPayload.organizationId,
          uploadType: UploadType.Asset,
        },
      )

      if (!credentials.generateUploadCredentials?.url) {
        throw new Error('Failed to generate upload credentials')
      }

      const url = credentials.generateUploadCredentials.url
      const uploadResponse = await fetch(url, {
        body: file,
        method: 'PUT',
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      const fileKey = extractS3Path(url)
      const fileName = file.name

      const input = {
        description: organizationDetails?.description?.trim(),
        domain: organizationDetails?.domain?.trim(),
        fileKey,
        fileName,
        industry: organizationDetails?.industry?.filter(Boolean) ?? [],
        name: organizationDetails?.name?.trim() ?? '',
        organizationId,
      }

      updateOrganizationLogo(input, {
        onError: (error) => {
          console.error('Failed to update organization logo: ', error)
          toast.error(
            t('failed_to_update_organization_logo', { ns: 'settings' }),
          )
        },
        onSuccess: () => {
          refetchUser()

          queryClient.invalidateQueries({
            queryKey: ['organization', organizationId],
          })

          queryClient.invalidateQueries({
            queryKey: ['organizationLogo', organizationId],
          })

          toast.success(
            t('organization_logo_updated_successfully', { ns: 'settings' }),
          )
        },
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(t('failed_to_upload_organization_logo', { ns: 'settings' }))
    }
  }

  const renderOrgAvatar = (name: string, url?: string | null) => {
    if (url) {
      return (
        <Image
          alt="Logo"
          height={48}
          key={url}
          src={url}
          style={{
            borderRadius: 4,
            display: 'block',
            objectFit: 'contain',
            width: 48,
          }}
        />
      )
    }

    return (
      <Avatar
        sx={{
          bgcolor: theme.palette.primary.main,
          borderRadius: 2,
          color: theme.palette.common.white,
          height: 32,
          width: 32,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
    )
  }

  return (
    <TableRow>
      <TableCell sx={{ width: '37%' }}>{t('icon')}</TableCell>
      <TableCell sx={{ flex: 1 }}>
        <Stack alignItems="center" direction="row" spacing={2} width="80%">
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
            sx={{ flex: 1, minWidth: 0 }}
          >
            {isFetchingLogo || isUpdatingOrganization ? (
              <Skeleton
                height={48}
                sx={{ borderRadius: 2 }}
                variant="rounded"
                width={48}
              />
            ) : (
              renderOrgAvatar(organizationDetails?.name ?? '', logoUrl)
            )}
          </Stack>
        </Stack>
      </TableCell>
      <TableCell align="right" sx={{ width: '30%' }}>
        <input
          accept="image/*"
          id="organization-logo-upload"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          type="file"
        />
        <Link
          component="button"
          onClick={() => {
            document.getElementById('organization-logo-upload')?.click()
          }}
          sx={{
            alignItems: 'flex-end',
            color: theme.palette.primary.main,
            display: 'inline-flex',
            fontSize: 'small',
            gap: 0.5,
            justifyContent: 'flex-end',
          }}
          width="100%"
        >
          <FileUploadOutlined fontSize="small" />
          {t('change_logo', { ns: 'settings' })}
        </Link>
      </TableCell>
    </TableRow>
  )
}

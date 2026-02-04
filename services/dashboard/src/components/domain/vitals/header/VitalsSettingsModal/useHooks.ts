import { useCreateBackgroundMutation } from '@zunou-queries/core/hooks/useCreateBackgroundMutation'
import { useCreateSettingMutation } from '@zunou-queries/core/hooks/useCreateSettingMutation'
import { useDeleteBackgroundMutation } from '@zunou-queries/core/hooks/useDeleteBackgroundMutation'
import { useUpdateBackgroundMutation } from '@zunou-queries/core/hooks/useUpdateBackgroundMutation'
import { useUpdateSettingMutation } from '@zunou-queries/core/hooks/useUpdateSettingMutation'
import toast from 'react-hot-toast'

import { GalleryUpdate } from '~/context/VitalsContext'
import { useS3Upload } from '~/hooks/useS3Upload'

export const useHooks = () => {
  const { uploadFile } = useS3Upload()

  const { mutateAsync: updateSetting } = useUpdateSettingMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: createSetting } = useCreateSettingMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: updateBackground } = useUpdateBackgroundMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: createBackground } = useCreateBackgroundMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: deleteBackground } = useDeleteBackgroundMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const uploadAndCreateBackground = async (background: GalleryUpdate) => {
    if (!background.tempFile) return

    const uploaded = await uploadFile(background.tempFile)

    const newBackground = await createBackground(
      {
        active: false,
        fileKey: uploaded.fileKey,
        fileName: uploaded.fileName,
        organizationId: background.organizationId,
        userId: background.userId,
      },
      {
        onError: () => {
          toast.error('One of the background uploads has failed')
        },
      },
    )

    return { ...newBackground, isSelectedBg: background.active }
  }

  return {
    createBackground,
    createSetting,
    deleteBackground,
    updateBackground,
    updateSetting,
    uploadAndCreateBackground,
  }
}

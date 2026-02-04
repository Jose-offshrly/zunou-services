import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { alpha, Box, Grid, styled, Typography } from '@mui/material'
import { Background } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'

import {
  GalleryUpdate,
  Status,
  useVitalsContext,
} from '~/context/VitalsContext'

const ImageThumbnail = styled(Box)(({ selected }: { selected?: boolean }) => ({
  '&:hover': {
    boxShadow: selected
      ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.5)}`
      : `0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'scale(1.02)',
  },
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  border: selected ? `2px solid ${theme.palette.primary.main}` : 'none',
  borderRadius: theme.shape.borderRadius,
  boxShadow: selected
    ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.5)}`
    : 'none',
  cursor: 'pointer',
  height: 60,
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  width: 60,
}))

export const BackgroundImageGallery = () => {
  const { t } = useTranslation('vitals')
  const {
    setSelectedBgDraft,
    selectedBgDraft,
    background,
    gallery,
    setBackground,
    galleryUpdates,
    setGalleryUpdates,
    setGallery,
  } = useVitalsContext()

  const backgrounds = gallery ?? []

  const handleRemoveImage = (event: React.MouseEvent, backgroundId: string) => {
    event.stopPropagation()

    const selected = gallery.find((bg) => bg.id === backgroundId)

    if (!selected) throw new Error('Background ID not found in gallery.')

    if (backgroundId === background?.id) {
      setSelectedBgDraft(null)
      setBackground(null)
    }

    const isAlreadyInGalleryUpdates = galleryUpdates.find(
      (bg) => bg.id === backgroundId,
    )

    const updatedGalleryUpdates = galleryUpdates
      .map((bg) => {
        // Return if not targeted bg
        if (bg.id !== backgroundId) return bg

        // Simply remove bg if its only in draft
        if (bg.status === 'CREATE') return null

        // If status is UPDATED simply change status to DELETE
        return { ...bg, status: 'DELETE' as Status }
      })
      .filter((bg): bg is GalleryUpdate => bg !== null)

    if (!isAlreadyInGalleryUpdates) {
      updatedGalleryUpdates.push({ ...selected, status: 'DELETE' as Status })
    }

    setGalleryUpdates(updatedGalleryUpdates)

    const tempGallery = gallery.filter((bg) => bg.id !== backgroundId)

    setGallery(tempGallery)
  }

  const handleSelectImage = (tempBg: Background) => setSelectedBgDraft(tempBg)

  return (
    <Box sx={{ mt: 2 }}>
      <Typography gutterBottom={true} variant="body2">
        {t('gallery')}
      </Typography>

      <Grid container={true} flexWrap="wrap" spacing={2} sx={{ mt: 1 }}>
        {gallery.map((bg) => (
          <Grid item={true} key={bg.id}>
            <Box sx={{ position: 'relative' }}>
              <ImageThumbnail
                onClick={() => handleSelectImage(bg)}
                selected={bg.id === selectedBgDraft?.id}
                sx={{
                  backgroundImage: `url(${bg.image_url})`,
                }}
              />
              <DeleteOutlinedIcon
                onClick={(e) => handleRemoveImage(e, bg.id)}
                sx={{
                  '&:hover': {
                    color: '#ff5252',
                    transform: 'scale(1.2)',
                  },
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '50%',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 16,
                  opacity: 1,
                  padding: 0.3,
                  position: 'absolute',
                  right: 2,
                  textShadow: '0 0 2px rgba(0,0,0,0.8)',
                  top: 2,
                  transition: 'all 0.2s ease-in-out',
                }}
              />
            </Box>
          </Grid>
        ))}

        {backgrounds.length === 0 && (
          <Box
            sx={{
              color: 'text.secondary',
              fontSize: '16px',
              py: 2,
              textAlign: 'center',
              width: '100%',
            }}
          >
            {t('no_images')}
          </Box>
        )}
      </Grid>
    </Box>
  )
}

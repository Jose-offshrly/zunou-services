import { useSortable } from '@dnd-kit/sortable'
import {
  Close,
  DragIndicator,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from '@mui/icons-material'
import { IconButton as MuiIconButton } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { IconButton } from '@zunou-react/components/form'

import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'

interface EditableProps {
  id: string
  isWidgetsDraftMode: boolean
  isDarkMode: boolean
  handleToggleSize: () => void
  isExpanded: boolean
  widgetId: string
  widgetName: string
}

export const Editable: React.FC<EditableProps> = ({
  id,
  isWidgetsDraftMode,
  isDarkMode,
  handleToggleSize,
  isExpanded,
  widgetId,
  widgetName,
}) => {
  const { organizationId } = useOrganization()
  const { updateWidget } = useVitalsContext()

  const { attributes, listeners, setNodeRef } = useSortable({
    id: widgetName,
  })

  const handleRemoveWidget = () => {
    updateWidget(id, 'DELETE', organizationId, widgetId)
  }

  return (
    <>
      <Stack alignItems="center" direction="row" ref={setNodeRef} spacing={2}>
        {isWidgetsDraftMode && (
          <>
            <Box
              component="span"
              sx={{
                alignItems: 'center',
                display: 'flex',
                mr: 1,
                position: 'relative',
              }}
              {...attributes}
              {...listeners}
            >
              <IconButton
                sx={{
                  '&:active': {
                    cursor: 'grabbing',
                  },
                  color: isDarkMode ? 'grey.400' : 'white',
                  // cursor: 'grab',
                  height: 24,
                  marginRight: 0,
                  minHeight: 24,
                  minWidth: 24,
                  padding: 0,
                  width: 24,
                }}
              >
                <DragIndicator sx={{ fontSize: '16px' }} />
              </IconButton>
            </Box>
            <MuiIconButton
              onClick={handleRemoveWidget}
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'secondary.dark',
                },
                backgroundColor: 'secondary.main',
                color: 'common.white',
                height: 24,
                minHeight: 24,
                minWidth: 24,
                padding: 0,
                width: 24,
              }}
            >
              <Close sx={{ fontSize: '16px' }} />
            </MuiIconButton>
          </>
        )}
      </Stack>

      {/* Only render the expand button when in edit mode */}
      {isWidgetsDraftMode && (
        <MuiIconButton
          className="expand-button"
          onClick={handleToggleSize}
          size="small"
          sx={{
            '&:hover': {
              backgroundColor: isDarkMode
                ? 'rgba(66, 66, 66, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
            },
            backgroundColor: isDarkMode ? 'grey.800' : 'white',
            boxShadow: 'None',
            color: isDarkMode ? 'grey.300' : 'grey.700',
            height: '24px',
            minHeight: '24px',
            minWidth: '24px',
            opacity: 0,
            padding: 0,
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'opacity 0.2s ease-in-out',
            width: '24px',
            zIndex: 10,
          }}
        >
          {isExpanded ? (
            <KeyboardDoubleArrowLeft
              fontSize="small"
              sx={{ fontSize: '16px' }}
            />
          ) : (
            <KeyboardDoubleArrowRight
              fontSize="small"
              sx={{ fontSize: '16px' }}
            />
          )}
        </MuiIconButton>
      )}
    </>
  )
}

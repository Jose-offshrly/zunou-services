import { Modal, useTheme } from '@mui/material'
import { Box, SxProps } from '@mui/system'
import {
  ActionButton,
  Card,
  CardContent,
  CardHeader,
} from '@zunou-react/components/layout'
import React from 'react'

import { useVitalsContext } from '~/context/VitalsContext'

interface VitalsCustomModalProps {
  children: React.ReactNode
  customHeaderActions?: React.ReactNode
  maxHeight?: number | string
  minHeight?: number | string
  headerActions?: ActionButton[]
  isOpen: boolean
  onClose: () => void
  style?: SxProps
  subheader?: string
  title?: string | React.ReactNode
  maxWidth?: number | string
  withPadding?: boolean
  vitalsMode?: boolean
  height?: string
}

export const VitalsCustomModal = ({
  maxHeight,
  minHeight,
  children,
  customHeaderActions,
  headerActions,
  isOpen,
  onClose,
  style,
  subheader,
  maxWidth = 860,
  title,
  withPadding = true,
  vitalsMode = true,
  height,
}: VitalsCustomModalProps) => {
  const { setting } = useVitalsContext()
  const muiTheme = useTheme()
  const isDarkMode = setting.theme === 'dark' && vitalsMode

  const scrollbarStyles = {
    '&::-webkit-scrollbar': {
      height: '4px',
      width: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: isDarkMode
        ? muiTheme.palette.grey[700]
        : muiTheme.palette.grey[300],
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: isDarkMode
        ? muiTheme.palette.grey[600]
        : muiTheme.palette.grey[400],
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  }

  const customTabStyles = {
    '& .MuiTab-root': {
      '&.Mui-selected': {
        color: isDarkMode
          ? muiTheme.palette.secondary.main
          : muiTheme.palette.primary.main,
        opacity: 1,
      },
      '&:hover': {
        color: isDarkMode
          ? muiTheme.palette.secondary.light
          : muiTheme.palette.primary.dark,
        opacity: 1,
      },
      color: isDarkMode
        ? muiTheme.palette.common.white
        : muiTheme.palette.grey[600],
      opacity: isDarkMode
        ? (theme: { palette: { action: { activeOpacity: number } } }) =>
            theme.palette.action.activeOpacity
        : 0.7,
    },
    '& .MuiTabs-indicator': {
      backgroundColor: isDarkMode
        ? muiTheme.palette.secondary.main
        : muiTheme.palette.primary.main,
      height: 3,
    },
    '& [role="tab"], & .tab-item, & .NavigationItem': {
      '&.active, &[aria-selected="true"], &.isActive': {
        '&::after': {
          backgroundColor: isDarkMode
            ? muiTheme.palette.secondary.main
            : muiTheme.palette.primary.main,
        },
        color: isDarkMode
          ? muiTheme.palette.secondary.main
          : muiTheme.palette.primary.main,
        opacity: 1,
      },
      '&:hover': {
        color: isDarkMode
          ? muiTheme.palette.common.white
          : muiTheme.palette.primary.dark,
        opacity: 1,
      },
      color: isDarkMode
        ? muiTheme.palette.common.white
        : muiTheme.palette.grey[600],
      cursor: 'pointer',
      opacity: isDarkMode ? 0.7 : 0.8,
      position: 'relative',
      transition: 'all 0.2s ease-in-out',
    },
  }

  // Added specific styles for form elements in dark mode
  const formElementStyles = {
    // Button Group styles
    '& .MuiButtonGroup-root': {
      '& .MuiButton-root': {
        backgroundColor: isDarkMode ? muiTheme.palette.grey[800] : undefined,
        color: isDarkMode ? muiTheme.palette.common.white : undefined,
      },
    },

    // Helper text
    '& .MuiFormHelperText-root': {
      color: isDarkMode ? muiTheme.palette.grey[500] : undefined,
    },

    // Form Labels
    '& .MuiFormLabel-root': {
      color: isDarkMode ? muiTheme.palette.grey[400] : undefined,
    },

    // Icon Button styles
    '& .MuiIconButton-root.Mui-disabled': {
      backgroundColor: isDarkMode ? muiTheme.palette.grey[800] : undefined,
    },

    // Text fields and inputs
    '& .MuiInputBase-root': {
      '& input, & textarea': {
        color: isDarkMode ? muiTheme.palette.common.white : undefined,
      },
      backgroundColor: isDarkMode ? muiTheme.palette.grey[900] : undefined,

      color: isDarkMode ? muiTheme.palette.common.white : undefined,
    },

    // Switch and toggle button styles
    '& .MuiSwitch-root': {
      '& .MuiSwitch-switchBase': {
        '&.Mui-checked': {
          '& + .MuiSwitch-track': {
            backgroundColor: isDarkMode
              ? muiTheme.palette.primary.dark
              : muiTheme.palette.primary.main,
            opacity: 0.9,
          },
          color: isDarkMode
            ? muiTheme.palette.primary.main
            : muiTheme.palette.primary.main,
        },
        color: isDarkMode ? muiTheme.palette.grey[400] : undefined,
      },
      '& .MuiSwitch-track': {
        backgroundColor: isDarkMode
          ? muiTheme.palette.grey[700]
          : muiTheme.palette.grey[300],
      },
    },

    // Toggle/Selection Button styles
    '& .MuiToggleButton-root': {
      '&.Mui-selected': {
        backgroundColor: isDarkMode
          ? muiTheme.palette.grey[800]
          : muiTheme.palette.action.selected,
        color: isDarkMode
          ? muiTheme.palette.primary.main
          : muiTheme.palette.primary.main,
      },
      backgroundColor: isDarkMode ? muiTheme.palette.grey[900] : undefined,
      border: `1px solid ${
        isDarkMode ? muiTheme.palette.grey[700] : muiTheme.palette.grey[300]
      }`,
      color: isDarkMode ? muiTheme.palette.common.white : undefined,
    },
  }

  return (
    <Modal
      disableAutoFocus={true}
      disableEnforceFocus={true}
      onClose={onClose}
      open={isOpen}
    >
      <Box>
        <Card
          sx={{
            bgcolor: isDarkMode ? 'grey.900' : 'background.paper',
            borderRadius: 2,
            boxShadow: isDarkMode
              ? '0 4px 20px rgba(0, 0, 0, 0.5)'
              : '0 4px 20px rgba(0, 0, 0, 0.15)',
            color: isDarkMode ? 'common.white' : 'text.primary',
            display: 'flex',
            flexDirection: 'column',
            height,
            left: '50%',
            maxHeight: maxHeight ? `${maxHeight}px` : '90vh',
            maxWidth,
            minHeight: minHeight ? `${minHeight}px` : 'auto',
            minWidth: 520,
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s ease-in-out',
            width: '75%',
            ...style,
          }}
        >
          <CardHeader
            customHeaderActions={customHeaderActions}
            headerActions={headerActions}
            onClose={onClose}
            subheader={subheader}
            sx={{
              '& .MuiCardHeader-subheader': {
                color: isDarkMode ? 'grey.300' : 'text.secondary',
              },
              '& .MuiCardHeader-title': {
                color: isDarkMode ? 'common.white' : 'text.primary',
                fontWeight: 500,
              },
              '& .MuiIconButton-root': {
                '&:hover': {
                  color: isDarkMode ? 'grey.100' : 'grey.800',
                },
                color: isDarkMode ? 'grey.400' : 'grey.600',
              },
              borderBottom: `1px solid ${isDarkMode ? muiTheme.palette.grey[800] : muiTheme.palette.grey[200]}`,
            }}
            title={title}
          />
          <CardContent
            sx={{
              ...(vitalsMode && scrollbarStyles),
              ...customTabStyles,
              ...formElementStyles,
              flexGrow: 1,
              overflow: 'auto',
              padding: withPadding ? 2 : 0,
              paddingBottom: withPadding ? 2 : '0 !important',
            }}
          >
            {children}
          </CardContent>
        </Card>
      </Box>
    </Modal>
  )
}

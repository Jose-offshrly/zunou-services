import RefreshIcon from '@mui/icons-material/Refresh'
import {
  CardContent,
  Divider,
  IconButton,
  keyframes,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha, Box, Stack } from '@mui/system'
import { Card } from '@zunou-react/components/layout'
import { ReactNode, useEffect, useState } from 'react'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useVitalsContext } from '~/context/VitalsContext'

import { Editable } from './Editable/Editable'

interface WidgetProps {
  children: ReactNode
  isLoading?: boolean
  name: string
  id: string
  widgetId: string
  showRefreshButton?: boolean
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
  onRefresh?: () => Promise<void> | void
  actions?: ReactNode
}

// edit mode wiggle
const wiggleAnimation = keyframes`
  0%, 25%, 50%, 75%, 100% { transform: rotate(0deg); }
  12.5%, 62.5% { transform: rotate(-1deg); }
  37.5%, 87.5% { transform: rotate(1deg); }
`

export const Widget = ({
  children,
  isLoading: externalLoading = false,
  name,
  id,
  isExpanded = false,
  onExpand,
  onRefresh,
  actions,
  widgetId,
  showRefreshButton = false,
}: WidgetProps) => {
  const { isWidgetsDraftMode, setting } = useVitalsContext()
  const muiTheme = useTheme()
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isLoading = externalLoading || isRefreshing

  const isDarkMode = setting.theme === 'dark'

  useEffect(() => {
    if (isWidgetsDraftMode) {
      setShouldAnimate(true)
      const timer = setTimeout(() => {
        setShouldAnimate(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isWidgetsDraftMode])

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

  const handleToggleSize = () => {
    onExpand?.(!isExpanded)
  }

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return

    try {
      setIsRefreshing(true)
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card
      onPointerDown={(e) => {
        e.stopPropagation()
      }}
      sx={{
        '&:hover': {
          '& .expand-button': {
            opacity: isWidgetsDraftMode ? 1 : 0,
          },
          outline: isWidgetsDraftMode
            ? `2px solid ${isDarkMode ? muiTheme.palette.primary.main : muiTheme.palette.secondary.main}`
            : '2px solid transparent',
        },
        animation: shouldAnimate
          ? `${wiggleAnimation} 0.3s ease-in-out`
          : 'none',
        bgcolor: isDarkMode ? 'grey.900' : 'background.paper',
        borderRadius: 2,
        boxShadow: 'none',
        color: isDarkMode ? 'grey.300' : 'text.primary',
        flex: 1,
        height: 400,
        minHeight: 400,
        outline: '8px solid transparent',
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        width: '100%',
      }}
    >
      {isWidgetsDraftMode && (
        <Stack
          height="100%"
          left={0}
          position="absolute"
          sx={{
            WebkitBackdropFilter: 'blur(2px)',
            backdropFilter: 'blur(2px)',
            bgcolor: (theme) =>
              isDarkMode
                ? // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  alpha(theme.palette.grey[900], 0.5)
                : // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  alpha(theme.palette.common.black, 0.1),
            zIndex: 9,
          }}
          top={0}
          width="100%"
        />
      )}
      <CardContent
        sx={{
          '&:last-child': {
            pb: 2,
          },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Stack direction="row" justifyContent="space-between">
          <Stack alignItems="center" direction="row">
            <Typography
              fontSize="small"
              fontWeight="bold"
              sx={{
                color: isDarkMode ? 'common.white' : 'common.black',
                padding: 1,
              }}
              zIndex={11}
            >
              {name}
            </Typography>
            {showRefreshButton && (
              <Tooltip title="Refresh data">
                <IconButton
                  disabled={isRefreshing}
                  onClick={handleRefresh}
                  size="small"
                  sx={{
                    '& .MuiSvgIcon-root': {
                      fontSize: '0.875rem',
                    },
                    '&:hover': {
                      color: isDarkMode ? 'grey.100' : 'grey.800',
                    },
                    '@keyframes spin': {
                      '0%': {
                        transform: 'rotate(0deg)',
                      },
                      '100%': {
                        transform: 'rotate(360deg)',
                      },
                    },
                    animation: isRefreshing
                      ? 'spin 1s linear infinite'
                      : 'none',
                    color: isDarkMode ? 'grey.400' : 'grey.600',
                    padding: '2px',
                  }}
                >
                  <RefreshIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          <Stack alignItems="center" direction="row" spacing={1} zIndex={10}>
            {!isWidgetsDraftMode && actions}
            <Editable
              handleToggleSize={handleToggleSize}
              id={id}
              isDarkMode={isDarkMode}
              isExpanded={isExpanded}
              isWidgetsDraftMode={isWidgetsDraftMode}
              widgetId={widgetId}
              widgetName={id}
            />
          </Stack>
        </Stack>

        <Divider
          sx={{
            bgcolor: isDarkMode ? 'grey.800' : 'grey.200',
            my: 1,
          }}
        />

        <Box
          sx={{
            ...scrollbarStyles,
            height: '100%',
            overflow: 'auto',
            position: isExpanded ? 'static' : 'relative',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: isExpanded ? 1 : 'auto',
          }}
        >
          {isLoading ? (
            <Stack
              alignItems="center"
              height="100%"
              justifyContent="center"
              width="100%"
            >
              <LoadingSpinner />
            </Stack>
          ) : (
            children
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

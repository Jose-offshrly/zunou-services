import {
  alpha,
  Box,
  CardActionArea,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Card, CardContent } from '@zunou-react/components/layout'
import React from 'react'

interface Props {
  title: string
  description: string
  icon?: React.ReactNode
  isRecommended?: boolean
  onClick?: () => void
  color: string
  isDisabled?: boolean
}

export default function OnboardingCard({
  title,
  description,
  icon,
  isRecommended = false,
  onClick,
  color,
  isDisabled = false,
}: Props) {
  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid divider',
        borderRadius: 3,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        flex: 1,
        opacity: isDisabled ? 0.9 : 1,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <CardActionArea
        disabled={isDisabled}
        onClick={onClick}
        sx={{
          '&:hover': {
            backgroundColor: isDisabled ? 'transparent' : 'background.action',
          },
          height: '100%',
          p: 2.5,
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Stack gap={2}>
            {/* Top Row */}
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
            >
              <Box
                sx={{
                  alignItems: 'center',
                  bgcolor: alpha(color, isDisabled ? 0.05 : 0.1),
                  borderRadius: 2,
                  display: 'flex',
                  height: 44,
                  justifyContent: 'center',
                  width: 44,
                }}
              >
                {icon}
              </Box>

              {isRecommended && (
                <Chip
                  label="Recommended"
                  sx={{
                    backgroundColor: '#eef0ff',
                    color: '#5b63ff',
                    fontSize: 12,
                    p: 0,
                  }}
                />
              )}
            </Stack>

            {/* Title */}
            <Typography fontWeight={500} variant="body1">
              {title}
            </Typography>

            {/* Description */}
            <Typography color="text.secondary" fontWeight={400} variant="body2">
              {description}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>

      {isDisabled && (
        <Box
          sx={{
            backgroundColor: alpha('#fff', 0.6),
            bottom: 0,
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        />
      )}
    </Card>
  )
}

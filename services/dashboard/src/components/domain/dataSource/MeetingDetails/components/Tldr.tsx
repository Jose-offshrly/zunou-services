import { InfoOutlined } from '@mui/icons-material'
import { alpha, Stack, Typography } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import React from 'react'

interface Props {
  content?: string
  children?: React.ReactNode
}

export default function Tldr({ content = 'Unavailable', children }: Props) {
  return (
    <Stack
      bgcolor={alpha(theme.palette.primary.light, 0.1)}
      border={1}
      borderRadius={2}
      p={2}
      sx={{
        borderColor: alpha(theme.palette.primary.main, 0.1),
      }}
    >
      <Stack gap={1}>
        <Stack
          alignItems="center"
          direction="row"
          gap={1}
          justifyContent="space-between"
        >
          <Stack alignItems="center" direction="row" gap={1}>
            <InfoOutlined
              fontSize="small"
              sx={{
                color: 'primary.main',
              }}
            />
            <Typography color="primary.main" fontWeight="bold" variant="body2">
              TL;DR
            </Typography>
          </Stack>

          {children}
        </Stack>

        <Typography variant="body2">{content}</Typography>
      </Stack>
    </Stack>
  )
}

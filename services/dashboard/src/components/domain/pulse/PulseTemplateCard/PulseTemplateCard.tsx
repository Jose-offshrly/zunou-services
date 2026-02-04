import {
  AccountBalance,
  AccountBalanceOutlined,
  AdminPanelSettings,
  Analytics,
  Apps,
  AutoAwesome,
  BackupTableOutlined,
  Business,
  Check,
  Diversity2,
  MeetingRoomOutlined,
  RocketLaunch,
  Settings,
  StyleOutlined,
  TerminalOutlined,
  TextSnippet,
} from '@mui/icons-material'
import { Card, CardContent, SvgIcon, Typography } from '@mui/material'
import { alpha, Box, Stack } from '@mui/system'
import type { MasterPulse, PulseType } from '@zunou-graphql/core/graphql'
import React, { useCallback } from 'react'
import { theme } from 'zunou-react/services/Theme'

export type PulseTemplateCardProps = Pick<
  MasterPulse,
  'id' | 'name' | 'type' | 'status' | 'features' | 'description'
>

const iconMap: Record<PulseType, React.ComponentType> = {
  account: AccountBalance,
  admin: AdminPanelSettings,
  app: Apps,
  book: BackupTableOutlined,
  diversity: Diversity2,
  finance: Business,
  generic: AutoAwesome,
  hr: Analytics,
  linked: AccountBalanceOutlined,
  location: MeetingRoomOutlined,
  mcp: RocketLaunch,
  note: StyleOutlined,
  ops: Settings,
  rocket: RocketLaunch,
  sdk: TerminalOutlined,
  text: TextSnippet,
}

export const PulseTemplateCard = ({
  id,
  features,
  name,
  type,
  status,
  createPulse,
}: {
  createPulse: (id: string) => void
} & PulseTemplateCardProps) => {
  const isLive = status === 'live'
  const IconComponent = iconMap[type] ?? AutoAwesome

  const handleCreatePulse = useCallback(() => {
    if (isLive) {
      createPulse(id)
    }
  }, [id, isLive, createPulse])

  return (
    <Card
      onClick={handleCreatePulse}
      sx={{
        '&:hover': {
          boxShadow: 'none',
        },
        bgcolor: 'transparent',
        borderRadius: 2,
        cursor: status === 'live' ? 'pointer' : 'default',
        flex: 1,
        height: '100%',
        minWidth: 240,
      }}
      variant="outlined"
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: '100%',
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Stack
            alignItems="center"
            bgcolor="primary.main"
            borderRadius={25}
            color="common.white"
            height={30}
            justifyContent="center"
            width={30}
          >
            <SvgIcon
              component={IconComponent}
              fontSize="inherit"
              sx={{ color: 'white' }}
            />
          </Stack>

          <Box
            borderRadius={0.5}
            paddingX={1}
            paddingY="1px"
            sx={{
              bgcolor: isLive
                ? alpha(theme.palette.secondary.main, 0.2)
                : 'grey.200',
            }}
          >
            <Typography
              color={isLive ? 'secondary.main' : 'grey.400'}
              fontSize={12}
              fontWeight="medium"
            >
              {isLive ? 'template' : 'coming soon'}
            </Typography>
          </Box>
        </Stack>
        <Typography fontSize={20} fontWeight={500}>
          {name}
        </Typography>
        <Stack spacing={1}>
          {features?.map((value, index) => (
            <Stack direction="row" key={index} spacing={1}>
              <Check fontSize="small" sx={{ color: 'secondary.main' }} />
              <Typography color="text.secondary" fontSize={14}>
                {value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

import { AccessTime, Add, Edit } from '@mui/icons-material'
import { alpha, Card, CardContent, Stack, Typography } from '@mui/material'
import { Strategy } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { IconButton } from '@zunou-react/components/form/IconButton'
import { theme } from '@zunou-react/services/Theme'

import { PrimaryGhostButton } from '~/components/ui/button/PrimaryGhostButton'

interface MissionCardProps {
  missions: Strategy[]
  onAddClick: () => void
  onEditClick: (mission: Strategy) => void
}

export const MissionCard = ({
  missions,
  onAddClick,
  onEditClick,
}: MissionCardProps) => {
  return (
    <Card
      sx={{
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 2,
        boxShadow: 'none',
        height: '100%',
        mb: 4,
        position: 'relative',
        width: '100%',
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Typography
            color="text.primary"
            fontWeight="medium"
            sx={{ mb: 2 }}
            variant="h6"
          >
            Mission
          </Typography>
          <PrimaryGhostButton
            onClick={onAddClick}
            sx={{ height: '32px', width: '32px' }}
          >
            <Add fontSize="small" />
          </PrimaryGhostButton>
        </Stack>
        {missions.length > 0 ? (
          <Stack alignItems="center" spacing={1} width="100%">
            {missions.map((mission) => (
              <Stack
                alignItems="center"
                border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}
                borderRadius={2}
                direction="row"
                key={mission.id}
                p={1}
                width="100%"
              >
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography color="text.primary" variant="subtitle2">
                    {mission.name}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {mission.description}
                  </Typography>
                </Stack>
                <IconButton onClick={() => onEditClick(mission)} size="small">
                  <Edit fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Stack
            alignItems="center"
            bgcolor={alpha(theme.palette.primary.main, 0.02)}
            border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}
            borderRadius={2}
            justifyContent="center"
            py={4}
            spacing={2}
            width="100%"
          >
            <Stack
              alignItems="center"
              bgcolor={alpha(theme.palette.text.secondary, 0.1)}
              borderRadius="50%"
              justifyContent="center"
              p={0.5}
            >
              <AccessTime
                fontSize="medium"
                sx={{ color: theme.palette.text.secondary }}
              />
            </Stack>
            <Typography
              align="center"
              color="text.secondary"
              sx={{ maxWidth: '80%' }}
              variant="body2"
            >
              Missions are the core of your workflow. Start by creating your
              first one!
            </Typography>
            <Button
              color="primary"
              onClick={onAddClick}
              sx={{ border: `1px solid ${theme.palette.primary.main}` }}
              variant="outlined"
            >
              Create a Mission
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

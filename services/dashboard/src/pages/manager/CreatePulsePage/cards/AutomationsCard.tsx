import { AccessTime, Add, Edit } from '@mui/icons-material'
import { alpha, Card, CardContent, Stack, Typography } from '@mui/material'
import { Strategy } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { IconButton } from '@zunou-react/components/form/IconButton'
import { theme } from '@zunou-react/services/Theme'

import { PrimaryGhostButton } from '~/components/ui/button/PrimaryGhostButton'

interface AutomationsCardProps {
  automations: Strategy[]
  onAddClick: () => void
  onEditClick: (automation: Strategy) => void
}

export const AutomationsCard = ({
  automations,
  onAddClick,
  onEditClick,
}: AutomationsCardProps) => {
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
            Automations
          </Typography>
          <PrimaryGhostButton
            onClick={onAddClick}
            sx={{ height: '32px', width: '32px' }}
          >
            <Add fontSize="small" />
          </PrimaryGhostButton>
        </Stack>

        {automations.length > 0 ? (
          <Stack alignItems="center" spacing={1} width="100%">
            {automations.map((automation) => (
              <Stack
                alignItems="center"
                border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}
                borderRadius={2}
                direction="row"
                key={automation.id}
                p={1}
                width="100%"
              >
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography color="text.primary" variant="subtitle2">
                    {automation.name}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {automation.description}
                  </Typography>
                </Stack>
                <IconButton
                  onClick={() => onEditClick(automation)}
                  size="small"
                >
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
              sx={{ maxWidth: '80%', mb: 3 }}
              variant="body2"
            >
              Automations simplify your workflow by triggering actions
              automatically. Start by creating your first one!
            </Typography>

            <Button
              color="primary"
              onClick={onAddClick}
              sx={{ border: `1px solid ${theme.palette.primary.main}` }}
              variant="outlined"
            >
              Create an Automation
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

import { Add } from '@mui/icons-material'
import { Card, CardContent, Grid, Typography } from '@mui/material'
import { alpha, Box, Stack } from '@mui/system'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  PulseTemplateCard,
  PulseTemplateCardProps,
} from '~/components/domain/pulse/PulseTemplateCard/PulseTemplateCard'
import { PrimaryIconButton } from '~/components/ui/button/PrimaryIconButton'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

interface CreatePulseCardProps {
  onClick: () => void
  label: string
}

export const PulseTemplateGrid = ({
  templates,
  createPulse,
}: {
  templates: PulseTemplateCardProps[]
  createPulse: (id: string, name: string) => void
}) => {
  const { t } = useTranslation('pulse')
  const navigate = useNavigate()
  const { organizationId } = useOrganization()

  const handleCreateFromScratch = () => {
    navigate(
      `/manager/${pathFor({
        pathname: Routes.PulseCreateCustom,
        query: {
          organizationId,
        },
      })}`,
    )
  }

  const handleCreateOneOnOne = () => {
    navigate(
      `/manager/${pathFor({
        pathname: Routes.PulseCreateOneOnOne,
        query: {
          organizationId,
        },
      })}`,
    )
  }

  const CreatePulseCard = ({ onClick, label }: CreatePulseCardProps) => {
    return (
      <Card
        onClick={onClick}
        sx={{
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `3px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
            cursor: 'pointer',
          },
          bgcolor: alpha(theme.palette.primary.main, 0.01),
          border: `3px dashed ${alpha(theme.palette.primary.main, 0.1)}`,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 260,
          transition: 'all 0.2s ease-in-out',
        }}
        variant="outlined"
      >
        <CardContent
          sx={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 2 }}
        >
          <Stack
            alignItems="center"
            flex={1}
            justifyContent="center"
            spacing={2}
          >
            <PrimaryIconButton>
              <Add fontSize="small" />
            </PrimaryIconButton>
            <Stack alignItems="center" justifyContent="center">
              <Typography color="primary.main" fontSize={14} fontWeight="bold">
                {label}
              </Typography>
              <Typography color="primary.main" fontSize={14} fontWeight="bold">
                {t('from_scratch')}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box padding={2}>
      <Grid
        alignItems="stretch"
        container={true}
        justifyContent="center"
        mb={2}
        spacing={2}
      >
        <Grid item={true} lg={3} md={4} sm={6} xl={2}>
          <CreatePulseCard
            label={t('create_team_pulse')}
            onClick={handleCreateFromScratch}
          />
        </Grid>
        <Grid item={true} lg={3} md={4} sm={6} xl={2}>
          <CreatePulseCard
            label={t('create_one_to_one_pulse')}
            onClick={handleCreateOneOnOne}
          />
        </Grid>
      </Grid>

      <Grid
        alignItems="stretch"
        container={true}
        justifyContent="center"
        spacing={2}
      >
        {templates.map(({ id, name, features, type, status }, index) => (
          <Grid item={true} key={index} lg={3} md={4} sm={6} xl={2}>
            <PulseTemplateCard
              createPulse={() => createPulse(id, name)}
              features={features}
              id={id}
              name={name}
              status={status}
              type={type}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

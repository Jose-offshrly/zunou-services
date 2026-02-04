import { SmartToyOutlined } from '@mui/icons-material'
import {
  alpha,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Icon,
  Stack,
  Typography,
} from '@mui/material'
import { Maybe, PulseType } from '@zunou-graphql/core/graphql'
import { useGetMonthlySummaryQuery } from '@zunou-queries/core/hooks/useGetMonthlySummaryQuery'
import { ButtonLink } from '@zunou-react/components/navigation'
import { pathFor } from '@zunou-react/services/Routes'
import { useMemo, useState } from 'react'

import { DateSelector } from '~/components/ui/date/DateSelector'
import { Routes } from '~/services/Routes'
import { getPulseIcon } from '~/utils/getPulseIcon'

interface StatsSectionProps {
  title: string
  pulseId: string
  organizationId: string
  icon: Maybe<PulseType> | undefined
}

const StatsSection = ({
  title,
  pulseId,
  organizationId,
  icon,
}: StatsSectionProps) => {
  const [dateState, setDateState] = useState(() => ({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  }))

  const queryVariables = useMemo(
    () => ({
      month: dateState.month,
      organizationId,
      pulseId,
      year: dateState.year,
    }),
    [dateState.month, dateState.year, organizationId, pulseId],
  )

  const { data: monthlySummaryData, isLoading } = useGetMonthlySummaryQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: queryVariables,
  })
  const monthlySummary = monthlySummaryData?.monthlySummary

  const renderHeader = () => (
    <Stack direction="row" justifyContent="space-between" mb={1}>
      <Stack alignItems="center" direction="row" spacing={1}>
        <Stack
          alignItems="center"
          bgcolor={(theme) => theme.palette.primary.main}
          borderRadius="50%"
          height={40}
          justifyContent="center"
          width={40}
        >
          <Icon
            component={getPulseIcon(icon)}
            sx={{ color: 'white', fontSize: 20 }}
          />
        </Stack>
        <ButtonLink
          color="inherit"
          href={`../${pathFor({
            pathname: Routes.PulseDetail,
            query: { organizationId, pulseId },
          })}`}
          sx={{ fontSize: 20 }}
          variant="text"
        >
          {title}
        </ButtonLink>
      </Stack>

      <DateSelector onChange={setDateState} value={dateState} />
    </Stack>
  )

  const renderStats = () => (
    <Grid container={true} spacing={2}>
      {isLoading ? (
        <Grid item={true} xs={12}>
          <Stack alignItems="center" justifyContent="center" py={4}>
            <CircularProgress />
          </Stack>
        </Grid>
      ) : (
        monthlySummary
          ?.filter(
            ({ title }) =>
              title?.toLowerCase() !== 'total money saved' &&
              title?.toLowerCase() !== 'total time saved',
          )
          .map(({ title, value }, index) => (
            <Grid item={true} key={index} lg={6} mt={2} sm={6} xs={6}>
              <Stack
                alignItems="center"
                border={1}
                borderColor={(theme) => alpha(theme.palette.primary.main, 0.1)}
                borderRadius={1}
                direction="row"
                height="100%"
                justifyContent="start"
                p={2}
                spacing={2}
              >
                <Stack
                  alignItems="center"
                  bgcolor={(theme) => alpha(theme.palette.secondary.main, 0.1)}
                  borderRadius="50%"
                  height={40}
                  justifyContent="center"
                  width={40}
                >
                  <SmartToyOutlined
                    sx={{
                      color: (theme) => theme.palette.secondary.main,
                      fontSize: 20,
                    }}
                  />
                </Stack>
                <Stack textAlign="left">
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontSize: 28,
                      fontWeight: 500,
                    }}
                  >
                    {value}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {title}
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
          ))
      )}
    </Grid>
  )

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
        borderRadius: 2,
        p: 1,
      }}
    >
      <CardContent>
        {renderHeader()}
        {renderStats()}
      </CardContent>
    </Card>
  )
}

export default StatsSection

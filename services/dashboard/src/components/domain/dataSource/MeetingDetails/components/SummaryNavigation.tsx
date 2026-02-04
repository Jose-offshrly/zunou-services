import { Tab, Tabs } from '@mui/material'
import { Stack } from '@mui/system'
import React from 'react'
import { useTranslation } from 'react-i18next'

export enum SummaryTab {
  Highlight = 'Highlight',
  Actionables = 'Actionables',
  Takeaways = 'Takeaways',
  Insights = 'Insights',
  Transcript = 'Transcript',
}

interface SummaryNavigationProps {
  value: SummaryTab
  onChange: (value: SummaryTab) => void
}

const SummaryNavigation: React.FC<SummaryNavigationProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation('sources')

  const handleSelectTab = (
    _event: React.SyntheticEvent,
    newValue: SummaryTab,
  ): void => {
    onChange(newValue)
  }

  return (
    <Stack
      bgcolor="background.paper"
      borderBottom={1}
      borderColor="divider"
      direction="row"
      flexShrink={0}
      justifyContent="start"
      pt={2}
    >
      <Tabs
        onChange={handleSelectTab}
        sx={{
          '& .MuiTab-root': {
            minHeight: 30,
            textTransform: 'none',
          },
          minHeight: 30,
        }}
        value={value}
      >
        <Tab
          disableRipple={true}
          label={t('highlight')}
          sx={{ gap: 0.5 }}
          value={SummaryTab.Highlight}
        />
        <Tab
          disableRipple={true}
          label={t('actionables')}
          sx={{ gap: 0.5 }}
          value={SummaryTab.Actionables}
        />
        <Tab
          disableRipple={true}
          label={'Takeaways'}
          sx={{ gap: 0.5 }}
          value={SummaryTab.Takeaways}
        />

        <Tab
          disableRipple={true}
          label={'Insights'}
          sx={{ gap: 0.5 }}
          value={SummaryTab.Insights}
        />
        <Tab
          disableRipple={true}
          label={t('transcript_and_speaker')}
          sx={{ gap: 0.5 }}
          value={SummaryTab.Transcript}
        />
      </Tabs>
    </Stack>
  )
}

export default SummaryNavigation

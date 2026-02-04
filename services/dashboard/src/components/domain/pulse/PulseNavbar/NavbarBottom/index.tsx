import { AutorenewOutlined, LightbulbOutlined } from '@mui/icons-material'
import { Stack, Tab, Tabs } from '@mui/material'
import { PulseCategory } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

import { TabLabelWithBadge } from '~/components/domain/pulse/PulseNavbar/NavbarBottom/components/TabLabelWithBadge'
import { NavButton } from '~/components/domain/pulse/PulseNavbar/NavButton'
import { TabLabel } from '~/components/domain/pulse/PulseNavbar/TabLabel'
import { SelectedTabEnum } from '~/store/usePulseStore'
import { DEFAULT_TOPIC } from '~/store/useTopicStore'

import { useHooks } from './hooks'

export const NavbarBottom = () => {
  const {
    createNewThread,
    currentPulseTopic,
    selectedTab,
    isPulseRefreshDisabled,
    t,
    handleSelectTab,
    pulseId,
    tabIndex,
    tabOptions,
    pulseCategory,
    pulseChatMode,
    setPulseChatMode,
  } = useHooks()

  if (pulseCategory === PulseCategory.Personal) return null

  return (
    <>
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        px={2}
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Tabs
          onChange={(_e, newValue: number) => handleSelectTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
            },
          }}
          value={tabIndex}
        >
          {tabOptions.map(({ label, path, icon }, index) => {
            return (
              <Tab
                // className={
                //   label === 'Tasks'
                //     ? 'joyride-onboarding-tour-4'
                //     : label === 'Notes'
                //       ? 'joyride-onboarding-tour-5'
                //       : ''
                // }
                key={index}
                label={
                  path === SelectedTabEnum.TEAM_CHAT ? (
                    <TabLabelWithBadge
                      icon={icon}
                      label={label}
                      pulseId={pulseId}
                    />
                  ) : (
                    <TabLabel icon={icon} label={label} />
                  )
                }
              />
            )
          })}
        </Tabs>

        {selectedTab === SelectedTabEnum.PULSE &&
          // Remove if current selected thread is not general
          currentPulseTopic.id === DEFAULT_TOPIC.id && (
            <Stack alignItems="center" direction="row" gap={1} pb={0.5}>
              {pulseChatMode === 'CHAT' && (
                <NavButton
                  customSx={{
                    color: 'primary.main',
                    fontSize: 'small',
                    fontWeight: 400,
                    px: 1.5,
                  }}
                  label="View All Insights"
                  onClick={() => setPulseChatMode('INSIGHTS')}
                  outlined={false}
                  startIcon={<LightbulbOutlined fontSize="small" />}
                />
              )}

              <NavButton
                customSx={{
                  px: 1.5,
                }}
                disabled={isPulseRefreshDisabled}
                label={t('refresh')}
                onClick={createNewThread}
                outlined={false}
                startIcon={<AutorenewOutlined />}
              />
            </Stack>
          )}
      </Stack>
    </>
  )
}

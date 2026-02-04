import { ChevronLeft, ChevronRight, StarOutline } from '@mui/icons-material'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Button } from '@zunou-react/components/form/Button'
import { IconButton } from '@zunou-react/components/form/IconButton'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useState } from 'react'

export interface MeetingSummary {
  id: string
  title: string
  description: string
  hasSummary: boolean
}

export interface TopicSection {
  id: string
  name: string
  type: 'agenda' | 'talking-points' | 'action-items' | 'decisions'
  createdBy: string
}

export interface TopicData {
  id: string
  name: string
  contributorCount: number
  createdBy: string
  meetingSummary: MeetingSummary
  sections: TopicSection[]
}

interface TopicsSectionProps {
  topic?: TopicData
  onSectionClick?: (sectionId: string) => void
  onMeetingSummaryClick?: () => void
}

export const TopicsSection = ({
  topic,
  onMeetingSummaryClick,
}: TopicsSectionProps) => {
  const [showSections, setShowSections] = useState(false)

  const handleMeetingSummaryClick = useCallback(() => {
    setShowSections(true)
    onMeetingSummaryClick?.()
  }, [onMeetingSummaryClick])

  const handleBackClick = useCallback(() => {
    setShowSections(false)
  }, [])

  // Don't render anything if no topic is provided (General mode)
  if (!topic) {
    return null
  }

  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.common.white,
        borderLeft: `1px solid ${theme.palette.divider}`,
        height: '100%',
        width: 320,
      }}
    >
      <Stack height="100%" spacing={0}>
        {!showSections ? (
          <>
            {/* Header */}
            <Stack
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                padding: 3,
              }}
            >
              <Stack direction="row" spacing={2}>
                {/* Hashtag Icon on the Left */}
                <Stack
                  sx={{
                    alignItems: 'center',
                    backgroundColor: theme.palette.secondary.main,
                    borderRadius: 1,
                    color: theme.palette.common.white,
                    display: 'flex',
                    fontSize: 'large',
                    fontWeight: 700,
                    height: 48,
                    justifyContent: 'center',
                    width: 48,
                  }}
                >
                  #
                </Stack>

                {/* Texts in Column on the Right */}
                <Stack direction="column" spacing={0.25}>
                  <Typography
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: 'medium',
                      fontWeight: theme.typography.fontWeightMedium,
                    }}
                  >
                    {topic.name}
                  </Typography>

                  <Typography
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: 'small',
                    }}
                  >
                    Created by {topic.createdBy}
                  </Typography>

                  <Typography
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: 'small',
                    }}
                  >
                    {topic.contributorCount} contributors
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            {/* Body */}
            <Stack sx={{ flex: 1, padding: 3 }}>
              <Stack spacing={2}>
                <Card
                  elevation={0}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    padding: '0 !important',
                  }}
                >
                  <CardContent
                    sx={{ '&:last-child': { padding: 1 }, padding: 1 }}
                  >
                    <Stack
                      alignItems="center"
                      bgcolor="white"
                      borderRadius={2}
                      direction="row"
                      justifyContent="space-between"
                      p={2}
                      spacing={2}
                    >
                      <Stack spacing={1}>
                        <Typography
                          sx={{
                            color: theme.palette.text.primary,
                            fontSize: 'medium',
                            fontWeight: theme.typography.fontWeightMedium,
                          }}
                        >
                          {topic.meetingSummary.title}
                        </Typography>
                        <Typography
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '14px',
                            lineHeight: 1.4,
                          }}
                        >
                          {topic.meetingSummary.description}
                        </Typography>
                      </Stack>
                      <IconButton
                        onClick={handleMeetingSummaryClick}
                        size="small"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '20px',
                        }}
                      >
                        <ChevronRight />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>
          </>
        ) : (
          <>
            <Stack
              sx={{
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'row',
                padding: 3,
              }}
            >
              <IconButton
                onClick={handleBackClick}
                size="small"
                sx={{
                  color: theme.palette.text.secondary,
                }}
              >
                <ChevronLeft />
              </IconButton>
              <Stack alignItems="center" direction="row" spacing={1}>
                <StarOutline sx={{ fontSize: 'large' }} />
                <Typography
                  sx={{
                    fontSize: 'medium',
                    fontWeight: theme.typography.fontWeightMedium,
                  }}
                >
                  {' '}
                  Sections{' '}
                </Typography>
              </Stack>
            </Stack>

            <Stack sx={{ flex: 1, padding: 3 }}>
              <Stack spacing={2}>
                {topic.sections.map((section) => (
                  <Stack
                    alignItems="flex-start"
                    direction="row"
                    key={section.id}
                    spacing={2}
                  >
                    <Box
                      sx={{
                        '&::after': {
                          backgroundColor: theme.palette.text.secondary,
                          content: '""',
                          height: '1px',
                          left: '50%',
                          position: 'absolute',
                          top: '18px',
                          width: '12px',
                        },
                        '&::before': {
                          backgroundColor: theme.palette.text.secondary,
                          content: '""',
                          height: '50px',
                          left: '50%',
                          position: 'absolute',
                          width: '1px',
                        },
                        position: 'relative',
                        width: '16px',
                      }}
                    />

                    <Stack alignItems="flex-start" spacing={1} width="100%">
                      <Button
                        fullWidth={true}
                        sx={{
                          color: theme.palette.text.primary,
                          fontSize: 'medium',
                          justifyContent: 'flex-start',
                          paddingTop: 1,
                          textAlign: 'left',
                        }}
                      >
                        {section.name}
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </>
        )}
      </Stack>
    </Stack>
  )
}

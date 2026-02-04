import { ArticleOutlined, Mic, Videocam } from '@mui/icons-material'
import { alpha, lighten, Stack, Typography } from '@mui/material'
import { grey } from '@mui/material/colors'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'

interface SummaryCardProps {
  title: string
  items: SummaryOption[]
  comingSoon?: boolean
  onItemClick?: (item: SummaryOption) => void
}

export interface SummaryOption {
  label: string
  prompt?: string
  status: 'available' | 'coming_soon'
  summary_id?: string
}

export interface MessageOptions {
  text_summary: SummaryOption[]
  audio_summary: SummaryOption[]
  video_summary: SummaryOption[]
}

interface KeyPointsMessageProps {
  options: MessageOptions
  onOptionSelect?: (option: SummaryOption) => void
}

const SummaryCard = ({
  title,
  items,
  comingSoon,
  onItemClick,
}: SummaryCardProps) => {
  const theme = useTheme()
  const [clickedItems, setClickedItems] = useState<Set<string>>(new Set())

  const handleClick = (item: SummaryOption) => {
    if (!comingSoon && item.prompt && !clickedItems.has(item.prompt)) {
      setClickedItems((prev) => new Set(prev).add(item.prompt!))
      onItemClick?.(item)
    }
  }

  return (
    <Stack position="relative" width="100%">
      <Stack
        border={1}
        borderColor={lighten(theme.palette.primary.main, 0.9)}
        borderRadius={1}
        gap={1}
        height="133px"
        padding={2}
        sx={comingSoon ? { filter: 'blur(1.5px)', opacity: 0.7 } : undefined}
        width="100%"
      >
        <Typography
          color={theme.palette.text.primary}
          fontSize={14}
          fontWeight={500}
        >
          {title}
        </Typography>
        {items.map((item, index) => (
          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            key={index}
            onClick={() => handleClick(item)}
            sx={{
              '&:hover':
                !comingSoon && !clickedItems.has(item.prompt!)
                  ? {
                      '& .icon-container': {
                        bgcolor: lighten(theme.palette.secondary.main, 0.8),
                      },
                      '& .summary-text': {
                        color: theme.palette.text.primary,
                      },
                    }
                  : {},
              cursor:
                comingSoon || clickedItems.has(item.prompt!)
                  ? 'default'
                  : 'pointer',
              opacity: clickedItems.has(item.prompt!) ? 0.5 : 1,
              transition: 'transform 0.2s ease, opacity 0.2s ease',
            }}
          >
            <Stack
              alignItems="center"
              bgcolor={lighten(theme.palette.secondary.main, 0.9)}
              borderRadius={100}
              className="icon-container"
              justifyContent="center"
              p={1}
              sx={{ transition: 'all 0.2s ease' }}
            >
              {title === 'Text Summary' && (
                <ArticleOutlined color="secondary" sx={{ fontSize: 16 }} />
              )}
              {title === 'Audio Summary' && (
                <Mic color="secondary" sx={{ fontSize: 16 }} />
              )}
              {title === 'Video Summary' && (
                <Videocam color="secondary" sx={{ fontSize: 16 }} />
              )}
            </Stack>
            <Typography
              className="summary-text"
              color={theme.palette.text.secondary}
              fontSize={14}
              fontWeight={400}
              sx={{ transition: 'color 0.2s ease' }}
            >
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {comingSoon && (
        <Stack
          alignItems="flex-end"
          bgcolor={alpha(grey[900], 0.2)}
          borderRadius={1}
          bottom={0}
          display="flex"
          left={0}
          padding={1}
          position="absolute"
          right={0}
          top={0}
        >
          <Typography color="white" sx={{ textShadow: `0 0 10px black` }}>
            Coming Soon
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}

export const KeyPointsMessage = ({
  options,
  onOptionSelect,
}: KeyPointsMessageProps) => (
  <Stack gap={2} mt={1} pl={5} width="100%">
    <Stack alignItems="center" direction="row" gap={1} justifyContent="center">
      <SummaryCard
        items={options.text_summary}
        onItemClick={(item) =>
          item.status === 'available' && onOptionSelect?.(item)
        }
        title="Text Summary"
      />
      <SummaryCard
        comingSoon={true}
        items={options.audio_summary}
        title="Audio Summary"
      />
      <SummaryCard
        comingSoon={true}
        items={options.video_summary}
        title="Video Summary"
      />
    </Stack>
  </Stack>
)

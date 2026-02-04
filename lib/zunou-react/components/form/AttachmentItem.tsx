import { FolderOpen, PlayCircle } from '@mui/icons-material'
import { alpha, darken, Stack, Typography } from '@mui/material'
import { DataSourceType } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import ReactMarkdown from 'react-markdown'

import { IconButton } from './IconButton'

export interface AttachmentData {
  data_source_id?: string
  summary_id?: string
  page_number?: number
  text_excerpt?: string
  data_source_type?: DataSourceType
  text?: string
  url?: string
  updatedAt?: string
}

export const AttachmentItem = ({
  item,
  index,
  handleClick,
}: {
  item: AttachmentData
  index: string | number
  handleClick: () => void
}) => {
  if (item.summary_id) {
    return (
      <Stack
        alignItems="center"
        bgcolor={alpha(theme.palette.primary.main, 0.1)}
        border={`1px solid ${alpha(theme.palette.primary.main, 0.2)}`}
        borderRadius={2}
        direction="row"
        key={item.summary_id}
        onClick={handleClick}
        spacing={2}
        sx={{
          cursor: 'pointer',
        }}
      >
        <Stack
          alignItems="center"
          bgcolor={alpha(theme.palette.primary.main, 0.2)}
          borderRadius="8px 0 0 8px"
          flex={1}
          justifyContent="center"
          p={2}
        >
          <FolderOpen color="primary" fontSize="large" />
        </Stack>
        <Stack flex={4} pr={2}>
          <Typography color="text.primary" fontSize={14} fontWeight={600}>
            {item.text}
          </Typography>
          <Typography
            color={alpha(theme.palette.primary.main, 0.5)}
            fontSize={12}
            fontWeight={400}
          >
            See summary
          </Typography>
        </Stack>
      </Stack>
    )
  }

  switch (item.data_source_type) {
    case DataSourceType.Mp4:
      return (
        <Stack
          alignItems="center"
          bgcolor={alpha(theme.palette.primary.main, 0.1)}
          border={`1px solid ${alpha(theme.palette.primary.main, 0.2)}`}
          borderRadius={2}
          direction="row"
          key={item.data_source_id}
          onClick={handleClick}
          spacing={2}
          sx={{
            cursor: 'pointer',
          }}
        >
          <Stack
            alignItems="center"
            bgcolor={alpha(theme.palette.primary.main, 0.2)}
            borderRadius="8px 0 0 8px"
            flex={1}
            justifyContent="center"
            p={2}
          >
            <PlayCircle color="primary" fontSize="large" />
          </Stack>
          <Stack flex={4} pr={2}>
            <Typography color="text.primary" fontSize={14} fontWeight={600}>
              MP4 Video
            </Typography>
            <Typography
              color={alpha(theme.palette.primary.main, 0.5)}
              fontSize={12}
              fontWeight={400}
            >
              Click to play the video
            </Typography>
          </Stack>
        </Stack>
      )

    default:
      return (
        <Stack alignItems="center" direction="row" spacing={1}>
          <IconButton
            onClick={handleClick}
            sx={{
              '&:hover': {
                backgroundColor: darken(theme.palette.secondary.main, 0.05),
              },
              backgroundColor: 'secondary.main',
              height: 36,
              width: 36,
            }}
          >
            <Typography color="common.white" fontSize={12}>
              {Number(index) + 1}
            </Typography>
          </IconButton>
          <Stack
            border="1px solid"
            borderColor={alpha(theme.palette.primary.main, 0.2)}
            borderRadius={1}
            flex={1}
            padding={1}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            <ReactMarkdown>{item.text}</ReactMarkdown>
          </Stack>
        </Stack>
      )
  }
}

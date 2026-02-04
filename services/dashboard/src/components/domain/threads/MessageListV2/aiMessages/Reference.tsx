import {
  DescriptionOutlined,
  InsertLinkOutlined,
  PlaylistAddCheckOutlined,
  TopicOutlined,
} from '@mui/icons-material'
import { alpha, darken, Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { ReferenceUI } from '@zunou-react/components/form/FormattedContent'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { truncate } from 'lodash'
import { useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'

import { TooltipWrapper } from '~/components/ui/TooltipWrapper'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

import { MAX_CHAR_PREV_MODE } from '../components/MessageContent'
import MainUiMessage from './MainUiMessage'

export enum ReferenceButtonType {
  Task = 'TASK',
  Note = 'NOTE',
  TeamChat = 'TEAM_CHAT',
  ExternalLink = 'EXTERNAL_LINK',
  Default = 'DEFAULT',
}

export const ReferenceButton = ({
  onClick,
  text,
  type,
  num,
  fontSize = 12,
}: {
  onClick?: () => void
  text: string
  type: ReferenceButtonType
  num?: number
  fontSize?: number | string
}) => {
  const isLong = text.length > 20

  const { bgColor, bgColorHover, numColor, textColor, Icon } = useMemo(() => {
    switch (type) {
      case ReferenceButtonType.Task:
        return {
          Icon: PlaylistAddCheckOutlined,
          bgColor: theme.palette.primary.light,
          bgColorHover: alpha(theme.palette.primary.main, 0.9),
          numColor: theme.palette.primary.main,
          textColor: theme.palette.common.white,
        }
      case ReferenceButtonType.Note:
        return {
          Icon: DescriptionOutlined,
          bgColor: theme.palette.reference.pastelYellow,
          bgColorHover: darken(theme.palette.reference.pastelYellow, 0.05),
          numColor: theme.palette.common.gold,
          textColor: theme.palette.text.primary,
        }
      case ReferenceButtonType.ExternalLink:
        return {
          Icon: InsertLinkOutlined,
          bgColor: theme.palette.reference.darkBlue,
          bgColorHover: alpha(theme.palette.reference.darkBlue, 0.8),
          numColor: theme.palette.reference.darkBlueV2,
          textColor: theme.palette.common.white,
        }
      default:
        return {
          Icon: TopicOutlined,
          bgColor: theme.palette.secondary.light,
          bgColorHover: alpha(theme.palette.secondary.main, 0.9),
          numColor: theme.palette.secondary.main,
          textColor: theme.palette.common.white,
        }
    }
  }, [type])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onClick?.()
    },
    [onClick],
  )

  const content = (
    <Button
      endIcon={
        num && (
          <Stack
            alignItems="center"
            bgcolor={numColor}
            borderRadius="50%"
            height={25}
            justifyContent="center"
            width={25}
          >
            <Typography color={textColor} fontSize={fontSize}>
              {num}
            </Typography>
          </Stack>
        )
      }
      onClick={handleClick}
      size="large"
      startIcon={<Icon fontSize="small" />}
      sx={{
        '&:hover': { bgcolor: bgColorHover },
        bgcolor: bgColor,
        borderRadius: 9999,
        color: textColor,
        fontSize: fontSize,
        textAlign: 'left',
        width: 'fit-content',
      }}
      variant="contained"
    >
      {isLong ? truncate(text, { length: 20 }) : text}
    </Button>
  )

  return isLong ? (
    <Stack width="fit-content">
      <TooltipWrapper title={text}>{content}</TooltipWrapper>
    </Stack>
  ) : (
    content
  )
}

interface ReferenceProps {
  message: string
  references: ReferenceUI[]
  isTruncate?: boolean
  showTextOnly?: boolean
}

export const normalizedType = (type?: string): ReferenceButtonType => {
  switch (type?.toLowerCase()) {
    case 'task':
      return ReferenceButtonType.Task
    case 'note':
      return ReferenceButtonType.Note
    case 'team_chat':
      return ReferenceButtonType.TeamChat
    case 'external_link':
    case 'externallink':
    case 'link':
      return ReferenceButtonType.ExternalLink
    default:
      return ReferenceButtonType.Default
  }
}

const Reference = ({
  message,
  references,
  isTruncate,
  showTextOnly = false,
}: ReferenceProps) => {
  const { userRole } = useAuthContext()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const navigate = useNavigate()

  const rolePrefix = useMemo(() => userRole?.toLowerCase() ?? '', [userRole])

  const handleRedirect = useCallback(
    (route: Routes, id: string) => {
      if (!pulseId) {
        toast.error('Missing pulse id')
        return
      }

      navigate(
        `/${rolePrefix}/${pathFor({
          pathname: route,
          query: { id, organizationId, pulseId },
        })}`,
      )
    },
    [navigate, organizationId, pulseId, rolePrefix],
  )

  const handleExternalLink = useCallback((url: string) => {
    try {
      // Ensure URL has protocol
      const fullUrl =
        url.startsWith('http://') || url.startsWith('https://')
          ? url
          : `https://${url}`

      window.open(fullUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error('Invalid URL')
    }
  }, [])

  const onClickHandler = useCallback(
    ({
      type,
      id,
      url,
    }: {
      type: ReferenceButtonType
      id: string
      url?: string
    }) => {
      const typeToActionMap: Record<ReferenceButtonType, () => void> = {
        [ReferenceButtonType.Task]: () => handleRedirect(Routes.PulseTasks, id),
        [ReferenceButtonType.Note]: () => handleRedirect(Routes.PulseNotes, id),
        [ReferenceButtonType.TeamChat]: () =>
          handleRedirect(Routes.PulseTeamChat, id),
        [ReferenceButtonType.ExternalLink]: () => {
          if (url) {
            handleExternalLink(url)
          } else {
            toast.error('No URL provided for external link')
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [ReferenceButtonType.Default]: () => {}, // fallback
      }

      typeToActionMap[type]?.()
    },
    [handleRedirect, handleExternalLink],
  )

  return (
    <Stack gap={2} width="100%">
      <MainUiMessage
        showBorderBottom={references.length > 0}
        text={
          isTruncate
            ? truncate(message, { length: MAX_CHAR_PREV_MODE })
            : message
        }
      />

      <Stack direction="row" flexWrap="wrap" gap={1} width="100%">
        {!showTextOnly &&
          references.map((ref, index) => {
            const type = normalizedType(ref.type)
            return (
              <ReferenceButton
                key={`${ref.id}_${ref.type}`}
                num={index + 1}
                onClick={() =>
                  onClickHandler({ id: ref.id, type, url: ref.url })
                }
                text={ref.title}
                type={type}
              />
            )
          })}
      </Stack>
    </Stack>
  )
}

export default Reference

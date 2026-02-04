import { Avatar, Box, Stack, Typography } from '@mui/material'
import { ReferenceUI } from '@zunou-react/components/form/FormattedContent'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { Descendant } from 'slate'

import pulseLogo from '~/assets/pulse-logo.png'
import {
  normalizedType,
  ReferenceButton,
  ReferenceButtonType,
} from '~/components/domain/threads/MessageListV2/aiMessages/Reference'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { serializeToHTML } from '~/utils/textUtils'

interface TeamChatReferenceProps {
  message: string
  references: ReferenceUI[]
  showBorder: boolean
  hasPadding: boolean
  shrink: boolean
  bgcolor?: string
}

export default function TeamChatReference({
  message,
  references,
  showBorder,
  hasPadding,
  shrink,
  bgcolor,
}: TeamChatReferenceProps) {
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

  const onClickHandler = useCallback(
    ({ type, id }: { type: ReferenceButtonType; id: string }) => {
      const typeToActionMap: Record<ReferenceButtonType, () => void> = {
        [ReferenceButtonType.Task]: () => handleRedirect(Routes.PulseTasks, id),
        [ReferenceButtonType.Note]: () => handleRedirect(Routes.PulseNotes, id),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [ReferenceButtonType.TeamChat]: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [ReferenceButtonType.ExternalLink]: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [ReferenceButtonType.Default]: () => {}, // fallback
      }

      typeToActionMap[type]?.()
    },
    [handleRedirect],
  )

  return (
    <Stack
      bgcolor={bgcolor ? bgcolor : 'common.white'}
      borderLeft={4}
      borderRadius={1}
      gap={2}
      maxWidth="80%"
      p={hasPadding ? 2 : 0}
      sx={{ borderColor: showBorder ? 'primary.light' : 'transparent' }}
    >
      <Stack>
        <Box
          dangerouslySetInnerHTML={{
            __html: (() => {
              try {
                const parsed: Descendant[] = JSON.parse(message ?? '')

                if (Array.isArray(parsed)) {
                  return serializeToHTML(parsed)
                }
              } catch (_err) {
                // Not JSON → fallback to legacy HTML
              }
              return message ?? ''
            })(),
          }}
          sx={{
            '& p': { margin: 0 },
            color: 'text.secondary',
            fontSize: shrink ? 'small' : undefined,
            padding: '0 !important',
            wordBreak: 'break-word',
          }}
        />
      </Stack>

      {references.map((ref) => {
        const type = normalizedType(ref.type)

        return (
          <ReferenceButton
            key={ref.id}
            onClick={() => onClickHandler({ id: ref.id, type })}
            text={ref.title}
            type={type}
          />
        )
      })}

      <Stack alignItems="center" direction="row">
        <Avatar
          alt="assistant"
          src={pulseLogo}
          sx={{ height: shrink ? 20 : 24, mr: 1.5, width: shrink ? 20 : 24 }}
        />
        <Typography
          color="text.secondary"
          fontSize={shrink ? 'small' : 'small'}
          fontStyle="italic"
        >
          Generated from Pulse Chat
        </Typography>
      </Stack>
    </Stack>
  )
}

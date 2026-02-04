import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useGetPulseMembersQuery } from '@zunou-queries/core/hooks/useGetPulseMembersQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ReactEditor } from 'slate-react'

import { SlateInput } from '~/components/ui/form/SlateInput'
import { MentionType } from '~/components/ui/form/SlateInput/custom-types'

interface Props {
  pulseName: string
  pulseId: string
}

export default function TeamChatForm({ pulseName, pulseId }: Props) {
  const { control } = useFormContext()
  const { user } = useAuthContext()

  // // Watch the message field for reactive updates
  // const teamchatMessage = watch('teamchat_message')

  const [_mentions, setMentions] = useState<MentionType[]>([])
  const slateEditorRef = useRef<ReactEditor | null>(null)

  const { data: membersData } = useGetPulseMembersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { pulseId },
  })

  const pulseMembers = membersData?.pulseMembers.data ?? []

  const mentionSuggestions = pulseMembers
    .filter((member) => member.user.id !== user?.id)
    .map((m) => ({ id: m.userId, name: m.user.name }))

  return (
    <Stack gap={2}>
      <Typography color="text.secondary" variant="body2">
        Message to{' '}
        <Typography
          color="text.primary"
          component="span"
          fontWeight="bold"
          variant="body2"
        >
          {pulseName} Team Chat
        </Typography>
      </Typography>

      <SlateInput
        control={control}
        editorRef={slateEditorRef}
        hideSend={true}
        mentionSuggestions={mentionSuggestions}
        name="teamchat_message"
        setMentions={setMentions}
        type="TEAM_CHAT"
      />
    </Stack>
  )
}

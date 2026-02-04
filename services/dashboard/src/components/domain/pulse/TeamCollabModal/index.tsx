import { SmartToyOutlined } from '@mui/icons-material'
import { Tab, Tabs, Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import { Origin, User } from '@zunou-graphql/core/graphql'
import { useCreateCollaborationMutation } from '@zunou-queries/core/hooks/useCreateCollaborationMutation'
import { useGetCollabsQuery } from '@zunou-queries/core/hooks/useGetCollabsQuery'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { CustomModal } from '~/components/ui/CustomModal'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'

import { OrgUserList } from './OrgUserList'
import { PulseMemberList } from './PulseMemberList'
import { TabPanel } from './TabPanel'

interface TeamCollabModalProps {
  isOpen: boolean
  handleClose: () => void
}

interface CollaborationFormData {
  description: string
  attendees: string[]
}

export const TeamCollabModal = ({
  isOpen,
  handleClose: onClose,
}: TeamCollabModalProps) => {
  const queryClient = useQueryClient()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pulse } = usePulseStore()

  const [tabValue, setTabValue] = useState(0)
  const [isSubmitting, setSubmitting] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [externalEmails, setExternalEmails] = useState<string[]>([])

  const { data: collabsData, refetch: refetchCollabData } = useGetCollabsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      default: false,
      organizationId,
      origin: Origin.Pulse,
      pulseId,
    },
  })
  const { mutateAsync: createCollaboration } = useCreateCollaborationMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const resetAndClose = () => {
    setSelectedUsers([])
    setExternalEmails([])
    onClose()
  }

  const onSubmit = useCallback(
    async (data: CollaborationFormData) => {
      if (!pulse || !organizationId || !pulseId) return

      try {
        setSubmitting(true)

        await refetchCollabData()

        const currentCollabCount = collabsData?.collabs.length ?? 0

        const allAttendees = [
          ...selectedUsers.map((user) => user.email),
          ...externalEmails,
        ]

        const response = await createCollaboration({
          attendees: allAttendees,
          description: data.description,
          external_attendees: externalEmails,
          invite_pulse: true,
          // "[PULSE_NAME - NUM] Collaboration Meet" is used as pattern to exclude it from google calendar meetings list
          name: `[${pulse.name} - ${String(currentCollabCount + 1).padStart(4, '0')}] Collaboration Meet`,
          organizationId: organizationId,
          pulseId: pulseId,
        })

        if (response) {
          await queryClient.refetchQueries({
            queryKey: ['collabs', organizationId, pulseId],
          })

          toast.success('Created collaboration successfully.')
          resetAndClose()
        }
      } catch (error) {
        toast.error('Failed to create collaboration. Please try again.')
        console.error('Error creating collaboration:', error)
      } finally {
        setSubmitting(false)
      }
    },
    [
      selectedUsers,
      externalEmails,
      collabsData,
      pulse,
      organizationId,
      pulseId,
      refetchCollabData,
      createCollaboration,
      queryClient,
      resetAndClose,
    ],
  )

  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onSubmit({
      attendees: [
        ...selectedUsers.map((user) => user.email),
        ...externalEmails,
      ],
      description: 'Real-time collaboration session',
    })
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={resetAndClose}
      style={{ maxWidth: 800 }}
      subheader="Invite participants to join the conversation in real time"
      title="Start a Collab"
    >
      <Stack justifyContent="center" spacing={2}>
        <Stack
          alignItems="center"
          bgcolor={alpha(theme.palette.primary.main, 0.1)}
          border={1}
          borderColor={alpha(theme.palette.primary.main, 0.1)}
          borderRadius={1}
          direction="row"
          padding={1.5}
          spacing={1}
          width="100%"
        >
          <Stack
            alignItems="center"
            bgcolor="primary.main"
            borderRadius={99}
            height={24}
            justifyContent="center"
            width={24}
          >
            <SmartToyOutlined
              sx={{ color: 'common.white', fontSize: 'medium' }}
            />
          </Stack>
          <Typography variant="body2">
            Pulse companion is automatically added.
          </Typography>
        </Stack>

        <Tabs onChange={handleTabChange} value={tabValue}>
          <Tab label="Invite from this Pulse" />
          <Tab label="Browse All Org Members" />
        </Tabs>

        {/* Pulse Members */}
        <TabPanel index={0} value={tabValue}>
          <PulseMemberList
            isSubmitting={isSubmitting}
            onSelectionChange={setSelectedUsers}
            onSubmit={handleSubmit}
          />
        </TabPanel>

        {/* Organization Users */}
        <TabPanel index={1} value={tabValue}>
          <OrgUserList
            isSubmitting={isSubmitting}
            onSelectionChange={setSelectedUsers}
            onSubmit={handleSubmit}
          />
        </TabPanel>
      </Stack>
    </CustomModal>
  )
}

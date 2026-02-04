import { CircularProgress, Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AssigneeDropdown } from '~/pages/manager/PulseTaskPage/View/ListView/CreateTaskForm/AssigneeDropdown'

interface SpeakerTagsEditorProps {
  speakers: string[]
  initialMapping: Record<string, string>
  setShowSpeakerTagsEditor: (value: boolean) => void
  onSave: (mappings: SpeakerMapping[]) => void
  isSaving: boolean
}

interface SpeakerMapping {
  user_name: string
  speaker: string
}

const SpeakerInput = ({
  currentSpeaker,
  onAssigneeChange,
  initialAssignee,
}: {
  currentSpeaker: string
  onAssigneeChange: (speaker: string, userName: string | null) => void
  initialAssignee?: string
}) => {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(
    null,
  )

  const handleAssigneeSelect = ({ id, name }: { id: string; name: string }) => {
    if (id != 'CUSTOM_NAME') {
      setSelectedAssigneeId(id)
    } else {
      setSelectedAssigneeId(null)
    }
    onAssigneeChange(currentSpeaker, name)
  }

  const handleOnClear = () => {
    setSelectedAssigneeId(null)
    onAssigneeChange(currentSpeaker, null)
  }

  return (
    <Stack alignItems="center" direction="row" spacing={4} width={320}>
      <Typography>Speaker {currentSpeaker}</Typography>
      <AssigneeDropdown
        allowCustomName={true}
        assigneeIds={selectedAssigneeId ? [selectedAssigneeId] : []}
        onClear={handleOnClear}
        onSelect={handleAssigneeSelect}
        placeholder={initialAssignee ? initialAssignee : undefined}
        singleAssignee={true}
      />
    </Stack>
  )
}

export const SpeakerTagsEditor = ({
  speakers,
  setShowSpeakerTagsEditor,
  onSave,
  isSaving,
  initialMapping,
}: SpeakerTagsEditorProps) => {
  const { t } = useTranslation('sources')

  // populate speaker mappings with initial mappings
  const [speakerMappings, setSpeakerMappings] = useState<SpeakerMapping[]>(
    () => {
      return speakers
        .filter((speaker) => initialMapping[speaker])
        .map((speaker) => ({
          speaker,
          user_name: initialMapping[speaker],
        }))
    },
  )

  const allSpeakersAssigned = speakerMappings.length === speakers.length

  // adds speaker-username mapping to the array when user selects a member from the dropdown
  const handleAssigneeChange = (speaker: string, userName: string | null) => {
    setSpeakerMappings((prev) => {
      const filtered = prev.filter((mapping) => mapping.speaker !== speaker)
      if (userName) {
        return [...filtered, { speaker, user_name: userName }]
      }
      return filtered
    })
  }

  return (
    <Stack spacing={4}>
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={4}
      >
        <Typography color="text.primary" fontSize={18} fontWeight="bold">
          {t('speaker_tags')}
        </Typography>
        <Stack direction="row">
          {/* SAVE BUTTON */}
          <Button
            disabled={!allSpeakersAssigned}
            onClick={() => onSave(speakerMappings)}
            sx={{
              width: 'fit-content',
            }}
            variant="contained"
          >
            {isSaving ? <CircularProgress color="inherit" size={20} /> : 'Save'}
          </Button>

          {/* CANCEL BUTTON */}
          <Button
            onClick={() => setShowSpeakerTagsEditor(false)}
            sx={{
              color: 'grey.500',
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
      <Stack alignItems="center">
        {speakers.map((speaker) => (
          <SpeakerInput
            currentSpeaker={speaker}
            initialAssignee={initialMapping[speaker]}
            key={speaker}
            onAssigneeChange={handleAssigneeChange}
          />
        ))}
      </Stack>
    </Stack>
  )
}

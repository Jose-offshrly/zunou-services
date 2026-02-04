import {
  Avatar,
  ButtonBase,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from '@mui/material'
import { PulseMember } from '@zunou-graphql/core/graphql'
import { useMemo, useState } from 'react'

import { usePulseStore } from '~/store/usePulseStore'
import { getFirstLetter } from '~/utils/textUtils'

interface AssigneesSelectorProps {
  onSelect: ({ id, name }: { id: string; name: string }) => void
  searchTerm?: string
  assigneeIds?: string[] | null
  hideCheckbox?: boolean
  allowCustomName?: boolean
  customPulseMembers?: PulseMember[]
}

export const AssigneesSelector = ({
  onSelect,
  searchTerm,
  assigneeIds,
  hideCheckbox = false,
  allowCustomName = false,
  customPulseMembers,
}: AssigneesSelectorProps) => {
  const { pulseMembers } = usePulseStore()

  const selectedPulseMembers = customPulseMembers
    ? customPulseMembers
    : pulseMembers

  const [selectedAssigneesState, setSelectedAssigneesState] = useState(() =>
    Object.values(selectedPulseMembers).reduce<Record<string, boolean>>(
      (acc, curr) => {
        acc[curr.userId] = assigneeIds?.includes(curr.userId) ?? false
        return acc
      },
      {},
    ),
  )

  const filteredPulseMembers = useMemo(() => {
    if (!searchTerm) return selectedPulseMembers

    return selectedPulseMembers.filter((member) =>
      member.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [selectedPulseMembers, searchTerm])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name: userId, checked, value: name } = event.target

    onSelect({ id: userId, name })

    setSelectedAssigneesState((prev) => ({
      ...prev,
      [userId]: checked,
    }))
  }

  const setCustomName = () => {
    if (allowCustomName && searchTerm) {
      onSelect({ id: 'CUSTOM_NAME', name: searchTerm })
    }
  }

  return (
    <FormControl
      sx={{ maxHeight: '40vh', overflowY: 'auto', px: 2, width: '100%' }}
    >
      <FormGroup>
        {allowCustomName && filteredPulseMembers.length < 1 && (
          <ButtonBase
            onClick={setCustomName}
            sx={{
              justifyContent: 'start',
            }}
          >
            <Typography>
              Set <i>{searchTerm}</i>
            </Typography>
          </ButtonBase>
        )}
        {Object.values(filteredPulseMembers).map(({ userId, user }) => {
          const { gravatar, name } = user

          return (
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedAssigneesState[userId]}
                  name={userId}
                  onChange={handleChange}
                  sx={hideCheckbox ? { display: 'none' } : {}}
                  value={user.name}
                />
              }
              key={userId}
              label={
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1}
                  sx={hideCheckbox ? { padding: '7px' } : {}}
                >
                  {gravatar ? (
                    <Avatar
                      src={gravatar}
                      sx={{ height: 24, width: 24 }}
                      variant="circular"
                    />
                  ) : (
                    <Typography color="common.white">
                      {getFirstLetter(name)?.toUpperCase()}
                    </Typography>
                  )}
                  <Typography>{name}</Typography>
                </Stack>
              }
            />
          )
        })}
      </FormGroup>
    </FormControl>
  )
}

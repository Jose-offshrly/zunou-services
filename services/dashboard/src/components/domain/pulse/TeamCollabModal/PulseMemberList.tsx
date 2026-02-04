import { Close, Search } from '@mui/icons-material'
import {
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Paper,
  Typography,
} from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { User } from '@zunou-graphql/core/graphql'
import { LoadingButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useMemo, useState } from 'react'

import { usePresence } from '~/hooks/usePresence'
import { usePulseStore } from '~/store/usePulseStore'

import { ParticipantItem } from './ParticipantItem'

interface PulseMemberListProps {
  isSubmitting: boolean
  onSelectionChange: (users: User[]) => void
  onSubmit: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export const PulseMemberList = ({
  isSubmitting,
  onSelectionChange,
  onSubmit,
}: PulseMemberListProps) => {
  const { pulseMembers, pulseMembership } = usePulseStore()

  const currentUserId = pulseMembership?.user.id

  const [selectedUsers, setSelectedUsers] = useState<User[]>(
    pulseMembers.map((member) => member.user),
  )

  const [externalEmails, setExternalEmails] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')

  const [query, setQuery] = useState('')
  const normalizedQuery = query.toLowerCase().trim()

  const presenceMap = usePresence(
    useMemo(() => pulseMembers.map((m) => m.user.id), [pulseMembers]),
  )

  const filteredPulseMembers = pulseMembers.filter((member) => {
    const { name, email } = member.user

    return (
      name.toLowerCase().includes(normalizedQuery) ||
      email.toLowerCase().includes(normalizedQuery)
    )
  })

  const currentList = filteredPulseMembers.map((member) => member.user)

  const allSelected =
    currentList.length > 0 &&
    currentList.every((user) =>
      selectedUsers.some((selected) => selected.id === user.id),
    )

  // Ensure current user is always included in selectedUsers
  useEffect(() => {
    if (currentUserId) {
      const currentUser = pulseMembers.find(
        (m) => m.user.id === currentUserId,
      )?.user

      if (currentUser && !selectedUsers.some((u) => u.id === currentUserId)) {
        setSelectedUsers((prev) => [...prev, currentUser])
      }
    }
  }, [currentUserId, pulseMembers])

  useEffect(() => {
    onSelectionChange(selectedUsers)
  }, [selectedUsers])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const isEnterOrSpace = event.key === 'Enter' || event.key === ' '
    const trimmedValue = inputValue.trim()

    const isValidEmail = (email: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (isEnterOrSpace && trimmedValue) {
      event.preventDefault()
      if (isValidEmail(trimmedValue)) {
        setExternalEmails([...externalEmails, trimmedValue])
        setInputValue('')
      }
    }
  }

  const handleDelete = (email: string) => {
    setExternalEmails(externalEmails.filter((e) => e !== email))
  }

  const handleToggleSelectParticipant = (user: User) => {
    // Prevent deselecting the current user
    if (user.id === currentUserId) {
      return
    }

    setSelectedUsers((prev) => {
      const isSelected = prev.some((p) => p.id === user.id)

      if (isSelected) {
        return prev.filter((p) => p.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedUsers((prev) => {
        // Filter out non-current users from the current list
        const filtered = prev.filter(
          (user) =>
            !currentList.some((u) => u.id === user.id) ||
            user.id === currentUserId,
        )
        return filtered
      })
    } else {
      setSelectedUsers((prev) => {
        const merged = [...prev]
        currentList.forEach((user) => {
          if (!merged.some((u) => u.id === user.id)) {
            merged.push(user)
          }
        })
        return merged
      })
    }
  }

  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Ensure current user is included before submitting
    if (currentUserId) {
      const currentUser = pulseMembers.find(
        (m) => m.user.id === currentUserId,
      )?.user

      if (currentUser && !selectedUsers.some((u) => u.id === currentUserId)) {
        const updatedUsers = [...selectedUsers, currentUser]
        setSelectedUsers(updatedUsers)
        onSelectionChange(updatedUsers)
      }
    }

    onSubmit(event)
  }

  return (
    <Stack spacing={1}>
      <FormControl fullWidth={true} variant="outlined">
        <OutlinedInput
          endAdornment={
            <IconButton
              onClick={() => setQuery('')}
              sx={{
                '&:hover': {
                  backgroundColor: 'transparent',
                },
                visibility: query.length ? 'visible' : 'hidden',
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
          placeholder="Search members"
          size="small"
          startAdornment={
            <InputAdornment position="end">
              <Search fontSize="small" />
            </InputAdornment>
          }
          sx={{ gap: 1, padding: 0 }}
          value={query}
        />
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            checked={allSelected}
            indeterminate={
              !allSelected &&
              selectedUsers.some((user) =>
                currentList.some((u) => u.id === user.id),
              )
            }
            onChange={toggleSelectAll}
            size="small"
          />
        }
        label={
          <Typography>Participants ({selectedUsers?.length ?? 0})</Typography>
        }
        sx={{ width: 'fit-content' }}
      />
      <Stack divider={<Divider />} height={196} overflow="auto" spacing={2}>
        {filteredPulseMembers.length <= 0 && query ? (
          <Stack alignItems="center">
            <Typography
              color="text.secondary"
              textAlign="center"
              variant="subtitle2"
            >
              No results.
            </Typography>
          </Stack>
        ) : (
          filteredPulseMembers.map((pulseMember) => {
            const {
              id,
              user: { email, gravatar, name, presence, id: userId },
            } = pulseMember

            return (
              <ParticipantItem
                checked={selectedUsers.some((u) => u.id === userId)}
                disabled={userId === currentUserId}
                email={email}
                gravatar={gravatar}
                key={id}
                name={name}
                onToggle={() => handleToggleSelectParticipant(pulseMember.user)}
                presence={presenceMap[userId] || presence}
              />
            )
          })
        )}
      </Stack>

      <Typography variant="body1">
        Include individuals who are not part of this pulse
      </Typography>
      <FormControl fullWidth={true}>
        <Paper
          sx={{
            bgcolor: 'background.paper',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            minHeight: 48,
            p: 1,
          }}
          variant="outlined"
        >
          {externalEmails.map((email) => (
            <Chip
              deleteIcon={<Close />}
              key={email}
              label={email}
              onDelete={() => handleDelete(email)}
              sx={{
                '& .MuiChip-deleteIcon': {
                  color: theme.palette.text.secondary,
                },
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            />
          ))}
          <OutlinedInput
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add one or more email addresses"
            sx={{
              '& fieldset': { border: 'none' },
              border: 'none',
              flex: 1,
              height: 32,
              p: 0,
            }}
            value={inputValue}
          />
        </Paper>
      </FormControl>

      <LoadingButton
        disabled={selectedUsers.length === 0}
        loading={isSubmitting}
        onClick={handleSubmit}
        type="submit"
        variant="contained"
      >
        Send Invite
      </LoadingButton>
    </Stack>
  )
}

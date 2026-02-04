import { PeopleOutlined, Search } from '@mui/icons-material'
import {
  Avatar,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Assignee, PulseMember } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { getFirstLetter } from '@zunou-react/utils/getFirstLetter'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { usePulseStore } from '~/store/usePulseStore'

import { PulseTaskAssigneesGroup } from '../PulseTaskAssigneesGroup'
import { AssigneesSelector } from './AssigneesSelector'

interface AssigneeDropdownProps {
  onClear: () => void
  onSelect: ({ id, name }: { id: string; name: string }) => void
  assigneeIds?: string[] | null
  disabled?: boolean
  singleAssignee?: boolean
  placeholder?: string
  allowCustomName?: boolean
  customPulseMembers?: PulseMember[]
}

export const AssigneeDropdown = ({
  onClear,
  onSelect,
  assigneeIds,
  disabled = false,
  singleAssignee = false,
  allowCustomName = false,
  placeholder,
  customPulseMembers,
}: AssigneeDropdownProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { pulseMembers } = usePulseStore()

  const selectedPulseMembers = customPulseMembers
    ? customPulseMembers
    : pulseMembers

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseLeave = () => {
    if (searchTerm.trim() !== '') return

    timeoutRef.current = setTimeout(() => {
      handleClose()
    }, 500)
  }

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current!)
    timeoutRef.current = null
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Filter out invalid assignee IDs and remove duplicates
  const validAssigneeIds = assigneeIds
    ? [...new Set(assigneeIds)].filter((id) =>
        selectedPulseMembers.some((member) => member.userId === id),
      )
    : []

  const selectedAssigneesGroup = selectedPulseMembers
    .filter((member) => validAssigneeIds.includes(member.userId))
    .reduce<Assignee[]>((acc, curr) => {
      // Prevent duplicates by checking if userId is already in the accumulator
      if (!acc.some((assignee) => assignee.user.id === curr.user.id)) {
        acc.push({ id: curr.id, user: curr.user })
      }
      return acc
    }, [])

  const selectedAssignee = selectedPulseMembers.find(
    ({ userId }) => userId === validAssigneeIds[0],
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleSelect = ({ id, name }: { id: string; name: string }) => {
    onSelect({ id, name })

    // show custom names if theyre being used
    if (allowCustomName) {
      setSelectedName(name)
    }

    // close menu immediately when user picks an option for single assignee dropdown
    if (singleAssignee) {
      handleClose()
    }
  }

  const handleClose = useCallback(() => {
    setAnchorEl(null)
    setSearchTerm('')
  }, [setSearchTerm])

  const handleClear = () => {
    setSelectedName('')
    onClear()
    handleClose()
  }

  return (
    <>
      <Button
        color="inherit"
        disabled={disabled}
        onClick={handleClick}
        startIcon={
          validAssigneeIds.length === 1 ? (
            <Avatar
              src={selectedAssignee?.user.gravatar ?? undefined}
              sx={{ height: 20, width: 20 }}
            >
              {getFirstLetter(selectedAssignee?.user.name)?.toUpperCase()}
            </Avatar>
          ) : !validAssigneeIds.length ? (
            // Show this icon only when this dropdown is used for multiple assignees
            !singleAssignee && <PeopleOutlined fontSize="small" />
          ) : null
        }
        sx={{
          backgroundColor: '#fafafa',
          borderColor: 'divider',
          borderRadius: 2,
          maxWidth: 160,
        }}
        variant="outlined"
      >
        {validAssigneeIds.length === 1 || selectedName ? (
          <Typography
            noWrap={true}
            sx={{
              overflow: ' hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedAssignee?.user.name || selectedName}
          </Typography>
        ) : validAssigneeIds.length ? (
          <PulseTaskAssigneesGroup assignees={selectedAssigneesGroup} />
        ) : // Show "Unassigned" if this dropdown is used for single assignees
        singleAssignee ? (
          <Typography color={theme.palette.grey['400']}>
            {placeholder || t('unassigned', { ns: 'tasks' })}
          </Typography>
        ) : (
          <Typography>{t('assignee', { ns: 'tasks' })}</Typography>
        )}
      </Button>
      <Menu
        MenuListProps={{
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        onClose={handleClose}
        open={Boolean(anchorEl)}
      >
        <Stack divider={<Divider />} spacing={1}>
          <Stack p={1} spacing={1}>
            <TextField
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              onChange={handleSearchChange}
              placeholder="Search for a person"
              size="small"
              value={searchTerm}
            />

            <Typography color="text.secondary" variant="body2">
              {t('select_people', { ns: 'tasks' })}
            </Typography>
          </Stack>
          <AssigneesSelector
            allowCustomName={allowCustomName}
            assigneeIds={validAssigneeIds}
            customPulseMembers={customPulseMembers}
            hideCheckbox={singleAssignee ? true : false}
            onSelect={handleSelect}
            searchTerm={searchTerm}
          />
          <MenuItem onClick={handleClear}>
            <Typography color="text.secondary">{t('clear')}</Typography>
          </MenuItem>
        </Stack>
      </Menu>
    </>
  )
}

import { Search } from '@mui/icons-material'
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
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ChipButton } from '~/components/ui/button/ChipButton'
import { usePulseStore } from '~/store/usePulseStore'
import { getFirstLetter } from '~/utils/textUtils'

interface AssigneeFilterProps {
  isActive: boolean
  onClear: () => void
  onSelect: (id: string) => void
  selectedAssigneeId?: string | null
}

export const AssigneeFilter = ({
  isActive,
  onClear,
  onSelect,
  selectedAssigneeId,
}: AssigneeFilterProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { pulseMembers } = usePulseStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const selectedAssignee = pulseMembers.find(
    (member) => selectedAssigneeId === member.userId,
  )

  const filteredPulseMembers = useMemo(() => {
    if (searchTerm.trim() === '') return pulseMembers

    return pulseMembers.filter((member) =>
      member.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [pulseMembers, searchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleClear = () => {
    onClear()
    handleClose()
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    handleClose()
  }

  return (
    <>
      <ChipButton
        isActive={isActive}
        label={
          selectedAssignee ? (
            <Stack direction="row" spacing={0.5}>
              <Avatar
                src={
                  selectedAssignee.user.gravatar ?? selectedAssignee.user.name
                }
                sx={{ height: 20, width: 20 }}
                variant="circular"
              />
              <Typography sx={{ color: 'black', fontSize: '14px' }}>
                {selectedAssignee.user.name}
              </Typography>
            </Stack>
          ) : (
            t('assignee')
          )
        }
        onClick={handleClick}
        onDelete={isActive ? handleClear : undefined}
        sx={{
          borderColor: 'grey.200',
          color: 'black',
          fontSize: '14px',
        }}
      />
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        slotProps={{
          paper: {
            style: {
              marginTop: 4,
              minWidth: 1,
            },
          },
        }}
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
              placeholder={t('search_member')}
              size="small"
              value={searchTerm}
            />
            <Typography color="text.secondary" variant="body2">
              {t('select_member', { ns: 'tasks' })}
            </Typography>
          </Stack>
          <Stack maxHeight={400} overflow="auto">
            {filteredPulseMembers.map(({ userId, user }) => {
              const { gravatar, name } = user

              return (
                <MenuItem key={userId} onClick={() => handleSelect(userId)}>
                  <Stack alignItems="center" direction="row" spacing={1}>
                    {gravatar ? (
                      <Avatar
                        src={gravatar}
                        sx={{ height: 32, width: 32 }}
                        variant="circular"
                      />
                    ) : (
                      <Typography color="common.white" fontSize="small">
                        {getFirstLetter(name)?.toUpperCase()}
                      </Typography>
                    )}
                    <Typography>{name}</Typography>
                  </Stack>
                </MenuItem>
              )
            })}
          </Stack>
        </Stack>
      </Menu>
    </>
  )
}

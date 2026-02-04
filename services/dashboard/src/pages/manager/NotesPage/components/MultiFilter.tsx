import { AddOutlined, KeyboardArrowDown, Search } from '@mui/icons-material'
import {
  Box,
  Checkbox,
  Chip,
  Divider,
  InputAdornment,
  ListItem,
  Menu,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material'
import { PulseCategory } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ChipButton } from '~/components/ui/button/ChipButton'
import { usePulseStore } from '~/store/usePulseStore'

type FilterType = 'all' | 'others' | 'my-labels'

interface LabelWithPulse {
  name: string
  pulseId?: string | null
}

interface MultiFilterProps {
  labels: LabelWithPulse[]
  selected: string[]
  onChange: (labels: string[]) => void
  onReset: () => void
  labelCounts?: Record<string, number>
  allCount?: number
  labelColors?: Record<string, string>
}

export const MultiFilter = ({
  labels,
  selected,
  onChange,
  onReset,
  labelCounts = {},
  allCount = 0,
  labelColors = {},
}: MultiFilterProps) => {
  const { t } = useTranslation('notes')
  const { pulse, pulseCategory } = usePulseStore()
  const currentPulseId = pulse?.id
  const isPersonalPulse = pulseCategory === PulseCategory.Personal

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setSearch('')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const open = Boolean(anchorEl)

  const filteredLabels = useMemo(() => {
    let filtered = labels

    if (isPersonalPulse) {
      if (filterType === 'my-labels') {
        filtered = labels.filter(
          (label) => label.pulseId === currentPulseId || !label.pulseId,
        )
      } else if (filterType === 'others') {
        filtered = labels.filter(
          (label) => label.pulseId && label.pulseId !== currentPulseId,
        )
      }
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((l) =>
        l.name.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [labels, filterType, currentPulseId, isPersonalPulse, search])

  const handleSelect = (label: string) => {
    if (label === 'All') {
      const allFilteredNames = filteredLabels.map((l) => l.name)
      const allSelected = allFilteredNames.every((name) =>
        selected.includes(name),
      )
      onChange(allSelected ? [] : allFilteredNames)
      return
    }

    onChange(
      selected.includes(label)
        ? selected.filter((l) => l !== label)
        : [...selected, label],
    )
  }

  const getFilterButtonSx = (type: FilterType) => ({
    borderColor: filterType === type ? 'primary.main' : 'grey.300',
    color: filterType === type ? 'primary.main' : 'text.secondary',
  })

  const getFilterLabel = () => {
    if (filterType === 'all') return t('all')
    if (filterType === 'others') return t('others')
    return t('my_labels')
  }

  return (
    <Stack
      direction="row"
      divider={<Divider flexItem={true} orientation="vertical" />}
      spacing={1.5}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="center"
        spacing={1.5}
      >
        <Typography alignSelf="center">Filter</Typography>
        <Button
          color="inherit"
          disabled={labels.length === 0}
          endIcon={<KeyboardArrowDown fontSize="small" />}
          onClick={handleOpen}
          size="small"
          startIcon={<AddOutlined fontSize="small" />}
          sx={{
            border: '1.5px dashed',
            borderRadius: '1rem',
          }}
          variant="outlined"
        >
          {t('add_label')}
        </Button>
        <Menu
          anchorEl={anchorEl}
          autoFocus={false}
          disableAutoFocus={true}
          disableAutoFocusItem={true}
          disableEnforceFocus={true}
          onClose={handleClose}
          open={open}
        >
          <Stack p={1} spacing={1}>
            <Typography variant="body2">{t('available_labels')}</Typography>
            <OutlinedInput
              autoFocus={true}
              onChange={handleSearchChange}
              placeholder={t('enter_label_name')}
              size="small"
              startAdornment={
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              }
              sx={{ width: '100%' }}
              value={search}
            />
            {isPersonalPulse && (
              <Stack direction="row" spacing={1}>
                <ChipButton
                  label={t('all')}
                  onClick={() => setFilterType('all')}
                  sx={getFilterButtonSx('all')}
                  variant="outlined"
                />
                <ChipButton
                  label={t('others')}
                  onClick={() => setFilterType('others')}
                  sx={getFilterButtonSx('others')}
                  variant="outlined"
                />
                <ChipButton
                  label={t('my_labels')}
                  onClick={() => setFilterType('my-labels')}
                  sx={getFilterButtonSx('my-labels')}
                  variant="outlined"
                />
              </Stack>
            )}
          </Stack>

          <ListItem disablePadding={true} sx={{ pl: 2, px: 1, py: 1 }}>
            <Typography fontSize={14} fontWeight={400} sx={{ flexGrow: 1 }}>
              {getFilterLabel()}
            </Typography>
            <Typography color="text.secondary" fontSize={14} fontWeight={400}>
              {filteredLabels.length}
            </Typography>
          </ListItem>

          <Divider />

          <Box
            sx={{
              maxHeight: 220,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
            }}
          >
            {filteredLabels.length === 0 && search ? (
              <ListItem>
                <Typography color="text.secondary" variant="caption">
                  {t('no_matching_labels')}
                </Typography>
              </ListItem>
            ) : (
              filteredLabels.map((label) => (
                <ListItem disablePadding={true} key={label.name}>
                  <Stack
                    alignItems="center"
                    direction="row"
                    pr={1}
                    sx={{ pl: 0.5, width: '100%' }}
                  >
                    <Checkbox
                      checked={selected.includes(label.name)}
                      onChange={() => handleSelect(label.name)}
                      size="small"
                    />
                    <Typography fontSize="small" sx={{ flexGrow: 1 }}>
                      {label.name}
                    </Typography>
                    <Typography color="text.secondary" fontSize="small">
                      {labelCounts[label.name] || 0}
                    </Typography>
                  </Stack>
                </ListItem>
              ))
            )}
          </Box>
        </Menu>

        {selected.length > 0 && (
          <Chip
            color="primary"
            label="Reset"
            onClick={onReset}
            variant="outlined"
          />
        )}
      </Stack>

      <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}>
        {selected.length === 0 ? (
          <ChipButton
            label={`${t('all')} (${allCount})`}
            sx={{ color: 'inherit' }}
          />
        ) : (
          selected.map((label) => {
            const labelColor = labelColors[label]
            const hasColor = labelColor && labelColor !== 'transparent'

            return (
              <ChipButton
                key={label}
                label={`${label} (${labelCounts[label] || 0})`}
                onDelete={() => handleSelect(label)}
                sx={{
                  background: hasColor ? labelColor : 'transparent',
                  borderColor: hasColor ? labelColor : undefined,
                }}
                variant="outlined"
              />
            )
          })
        )}
      </Stack>
    </Stack>
  )
}

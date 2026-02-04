import { Check } from '@mui/icons-material'
import {
  Avatar,
  Icon,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Box } from '@mui/system'
import { PulseType } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { IconButton } from '@zunou-react/components/form/IconButton'
import { theme } from '@zunou-react/services/Theme'
import { FormEvent, MouseEvent, useState } from 'react'
import { UseFormRegister } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { getPulseIcon } from '~/utils/getPulseIcon'

import { PulseFormData } from '../types'

interface PageHeaderProps {
  companyName: string
  register: UseFormRegister<PulseFormData>
  onSubmit: () => void
  selectedIcon: PulseType
  onIconSelect: (value: PulseType) => void
  isDisabled: boolean
  isValid: boolean
}

export const PageHeader = ({
  companyName,
  register,
  onSubmit,
  selectedIcon,
  onIconSelect,
  isDisabled,
  isValid,
}: PageHeaderProps) => {
  const navigate = useNavigate()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleIconSelect = (value: PulseType) => {
    onIconSelect(value)
    setAnchorEl(null)
  }

  const handleCancel = () => {
    navigate(-1)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const handleIconClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const selectedIconOption = Object.values(PulseType).find(
    (option) => option === selectedIcon,
  )

  return (
    <Stack
      component="form"
      noValidate={true}
      onSubmit={handleSubmit}
      spacing={2}
    >
      <Stack
        alignItems="flex-start"
        direction="row"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Stack alignItems="flex-start" justifyContent="flex-start" spacing={2}>
          <Typography fontWeight="medium" textAlign="center" variant="h4">
            <Box
              component="span"
              sx={{
                textDecoration: 'underline',
                textDecorationColor: theme.palette.secondary.main,
                textUnderlineOffset: 20,
              }}
            >
              Create
            </Box>{' '}
            a pulse
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            color="inherit"
            onClick={handleCancel}
            size="medium"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={isDisabled}
            size="medium"
            type="submit"
            variant="contained"
          >
            Make
          </Button>
        </Stack>
      </Stack>

      <Stack alignItems="center" direction="row" p={2} spacing={1}>
        <IconButton onClick={handleIconClick} size="small" sx={{ p: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            {selectedIconOption &&
              (() => {
                const IconComponent = getPulseIcon(selectedIconOption)
                return <IconComponent />
              })()}
          </Avatar>
        </IconButton>

        <Menu
          MenuListProps={{
            sx: {
              padding: 0,
            },
          }}
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          open={Boolean(anchorEl)}
          slotProps={{
            paper: {
              style: {
                borderRadius: 2,
                maxHeight: '380px',
                minWidth: 200,
                overflow: 'auto',
              },
            },
          }}
        >
          {Object.values(PulseType).map((type) => {
            const isSelected = selectedIcon === type

            return (
              <MenuItem
                key={type}
                onClick={() => handleIconSelect(type)}
                sx={{
                  alignItems: 'center',
                  boxShadow: 'none',
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                }}
              >
                <Stack alignItems="center" direction="row" gap={1}>
                  <Icon
                    component={getPulseIcon(type)}
                    fontSize="small"
                    sx={{ color: 'text.primary' }}
                  />
                  <Typography fontWeight={500} ml={1} variant="body1">
                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                  </Typography>
                </Stack>
                {isSelected && (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      color: 'white',
                      height: 20,
                      width: 20,
                    }}
                  >
                    <Check fontSize="small" sx={{ height: 14, width: 14 }} />
                  </Stack>
                )}
              </MenuItem>
            )
          })}
        </Menu>

        <Stack alignItems="center" direction="row" spacing={1} width="50%">
          <TextField
            {...register('companyName')}
            error={!isValid}
            helperText={`${companyName?.length || 0}/100`}
            inputProps={{ maxLength: 100 }}
            placeholder="Insert Pulse name"
            required={true}
            size="small"
            sx={{
              pt: 3,
              width: '100%',
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

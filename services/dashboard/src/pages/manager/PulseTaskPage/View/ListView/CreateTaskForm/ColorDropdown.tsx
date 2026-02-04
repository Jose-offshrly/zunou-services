import { Box, Popover, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { useTranslation } from 'react-i18next'

interface ColorDropdownProps {
  onSelect: (color: string | null) => void
  selectedColor?: string | null
  disabled?: boolean
}

export const ColorDropdown = ({
  onSelect,
  selectedColor,
  disabled = false,
}: ColorDropdownProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [tempColor, setTempColor] = useState<string>(selectedColor || '#2196F3')

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleColorChange = (color: string) => {
    setTempColor(color)
  }

  const handleApply = () => {
    onSelect(tempColor)
    handleClose()
  }

  const handleClear = () => {
    onSelect(null)
    handleClose()
  }

  return (
    <>
      <Button
        color="inherit"
        disabled={disabled}
        onClick={handleClick}
        sx={{
          backgroundColor: '#fafafa',
          borderColor: 'divider',
          borderRadius: 2,
        }}
        variant="outlined"
      >
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
          {selectedColor && (
            <Box
              sx={{
                backgroundColor: selectedColor,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '50%',
                height: 16,
                width: 16,
              }}
            />
          )}
          <Typography
            color={disabled ? 'grey.300' : selectedColor ? 'text.primary' : ''}
          >
            {selectedColor
              ? selectedColor
              : t('color', { ns: 'tasks' }) || 'Color'}
          </Typography>
        </Box>
      </Button>

      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        transformOrigin={{
          horizontal: 'left',
          vertical: 'top',
        }}
      >
        <Box sx={{ p: 2 }}>
          <HexColorPicker color={tempColor} onChange={handleColorChange} />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              fullWidth={true}
              onClick={handleApply}
              size="small"
              variant="contained"
            >
              {t('apply', { ns: 'tasks' }) || 'Apply'}
            </Button>
            <Button
              color="inherit"
              fullWidth={true}
              onClick={handleClear}
              size="small"
              variant="outlined"
            >
              {t('clear', { ns: 'common' }) || 'Clear'}
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
}

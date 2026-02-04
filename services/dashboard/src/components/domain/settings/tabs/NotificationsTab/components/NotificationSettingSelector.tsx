import {
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

interface NotificationSettingSelectorProps {
  value: string
  onChange: (event: SelectChangeEvent) => void
  isLoading: boolean
}

export default function NotificationSettingSelector({
  value,
  onChange,
  isLoading,
}: NotificationSettingSelectorProps) {
  const { t } = useTranslation('common')

  if (isLoading) {
    return (
      <Skeleton
        animation="wave"
        height={40}
        sx={{
          borderRadius: 1,
          flex: 1,
          m: 1,
        }}
        variant="rectangular"
      />
    )
  }

  return (
    <FormControl
      hiddenLabel={true}
      size="small"
      sx={{
        //   remove border at the bottom
        '& .MuiFilledInput-root': {
          '&:after': {
            borderBottom: 'none',
          },
          '&:before': {
            borderBottom: 'none',
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottom: 'none',
          },
        },

        flex: 1,

        m: 1,
      }}
      variant="filled"
    >
      <Select
        displayEmpty={true}
        inputProps={{ 'aria-label': 'Without label' }}
        onChange={onChange}
        sx={{ fontSize: 14 }}
        value={value}
      >
        <MenuItem value="all">{t('receive_all')}</MenuItem>
        <MenuItem value="mentions">{t('mentions_only')}</MenuItem>
        <MenuItem value="off">{t('alerts_off')}</MenuItem>
      </Select>
    </FormControl>
  )
}

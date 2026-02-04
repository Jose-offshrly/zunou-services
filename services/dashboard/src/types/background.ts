import { alpha } from '@mui/system'
import { theme } from '@zunou-react/services/Theme'
import { ValueOf } from '@zunou-react/utils/valueOf'

export const BackgroundColorEnum = {
  PRIMARY: 'primary.main',
  SECONDARY: 'secondary.main',
  SECONDAY_LIGHT: alpha(theme.palette.secondary.main, 0.1),
  WHITE: 'common.white',
} as const

export type BackgroundColorType = ValueOf<typeof BackgroundColorEnum>

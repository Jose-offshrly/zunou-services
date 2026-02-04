import { Box } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { SxProps } from '@mui/system'
import zunouLogo from '@zunou-react/assets/images/zunou-logo.png'
import { Image } from '@zunou-react/components/utility/Image'
import type { PropsWithChildren } from 'react'

interface Props {
  sx?: SxProps<Theme>
}

export const PageLogoPane = ({ children, sx }: PropsWithChildren<Props>) => (
  <Box alignSelf="stretch" display="flex" flex={1} flexDirection="column">
    <Box padding={4}>
      <Image alt="Zunou Logo" src={zunouLogo} />
    </Box>

    <Box
      alignItems="center"
      display="flex"
      flex={1}
      flexDirection="column"
      justifyContent="center"
      sx={sx}
    >
      {children}
    </Box>
  </Box>
)

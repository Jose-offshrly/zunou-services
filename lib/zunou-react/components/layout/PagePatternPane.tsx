import { Box } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { SxProps } from '@mui/system'
import linePattern from '@zunou-react/assets/images/line_pattern.png'
import { Image } from '@zunou-react/components/utility/Image'
import type { PropsWithChildren } from 'react'

interface Props {
  sx?: SxProps<Theme>
}

export const PagePatternPane = ({ children, sx }: PropsWithChildren<Props>) => (
  <Box
    alignItems="center"
    alignSelf="stretch"
    bgcolor="grey.100"
    display="flex"
    flex={1}
    flexDirection="column"
    justifyContent="center"
    sx={sx}
  >
    {children}

    <Image position="absolute" right={0} src={linePattern} top={0} />

    <Image bottom={0} left="50%" position="absolute" src={linePattern} />
  </Box>
)

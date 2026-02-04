import { Box, BoxProps } from '@mui/material'

import { theme } from '../../services/Theme'

interface Props extends BoxProps {
  alt?: string
  src: string
}

export const Image = ({ alt, src, sx, ...rest }: Props) => {
  return (
    <Box
      alt={alt}
      component="img"
      src={src}
      sx={{
        alignSelf: 'center',
        borderRadius: `${theme.shape.borderRadius}px`,
        ...sx,
      }}
      {...rest}
    />
  )
}

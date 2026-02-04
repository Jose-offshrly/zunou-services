import { Stack, StackProps } from '@mui/system'

export const Container = ({ children, sx, ...props }: StackProps) => {
  return (
    <Stack sx={{ ...sx }} {...props}>
      {children}
    </Stack>
  )
}

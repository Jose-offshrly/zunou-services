import { Box } from '@mui/system'

const HeaderDecorator = ({ color = 'primary.main' }: { color?: string }) => {
  return (
    <Box
      sx={{
        bgcolor: color,
        height: '2px',
        width: '80px',
      }}
    />
  )
}

export default HeaderDecorator

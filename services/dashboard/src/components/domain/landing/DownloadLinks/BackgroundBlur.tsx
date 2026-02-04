import { Box } from '@mui/material'

const BackgroundBlur = () => (
  <Box
    bgcolor="secondary.main"
    borderRadius="50%"
    height="80%"
    position="absolute"
    sx={{
      backdropFilter: 'blur(50px)',
      filter: 'blur(20px)',
      left: '50%',
      opacity: 0.1,
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }}
    width="80%"
    zIndex={40}
  />
)

export default BackgroundBlur

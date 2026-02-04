import { Box, Stack, Typography } from '@mui/material'

const DashboardRelayWall = () => {
  return (
    <Stack
      alignItems="center"
      bgcolor="#f5f5f5"
      height="100%"
      justifyContent="center"
      width="100%"
    >
      <Box
        bgcolor="#ffffff"
        border="2px dashed #ccc"
        borderRadius="16px"
        boxShadow={2}
        maxWidth="500px"
        p={4}
        textAlign="center"
      >
        <Typography gutterBottom={true} variant="h4">
          Under Development
        </Typography>
        <Typography variant="body1">
          The Relay Wall is currently in development. Check back soon for
          updates!
        </Typography>
      </Box>
    </Stack>
  )
}

export default DashboardRelayWall

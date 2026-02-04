import { alpha, Box } from '@mui/system'
import zunouIcon from '@zunou-react/assets/images/zunou-icon.png'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useLocation, useNavigate } from 'react-router-dom'

const ADMIN_LOGIN_URL = 'https://dashboard.zunou.ai'

export const Navbar = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogin = () => {
    window.location.href = ADMIN_LOGIN_URL
  }

  const handleNavigate = (href: string) => {
    navigate(href)
  }

  return (
    <Box
      alignItems="center"
      display="flex"
      justifyContent="space-between"
      padding={2}
      sx={{
        bgcolor: 'white',
        borderBottom: 1,
        borderColor: alpha(theme.palette.primary.main, 0.1),
      }}
    >
      {pathname !== '/' && (
        <Box
          onClick={() => handleNavigate('/')}
          sx={{
            alignItems: 'center',
            cursor: 'pointer',
            display: 'flex',
            height: '100%',
          }}
        >
          <Box
            alt="zunou-logo"
            component="img"
            src={zunouIcon}
            sx={{
              borderRadius: 99,
              height: '40px',
            }}
          />
        </Box>
      )}

      <Box display="flex" flex="1" justifyContent="end">
        <Button onClick={handleLogin} size="large" variant="contained">
          Login for Admin
        </Button>
      </Box>
    </Box>
  )
}

import { CallMadeOutlined } from '@mui/icons-material'
import { Button } from '@zunou-react/components/form'

const RedirectButton = ({ text, url }: { text: string; url: string }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      endIcon={<CallMadeOutlined />}
      onClick={handleClick}
      sx={{
        '& .MuiButton-endIcon': {
          '& > *:first-of-type': {
            fontSize: 14,
          },
          fontSize: 14,
          marginBottom: 0.5,
          marginLeft: 0.5,
        },
        '&:hover': {
          bgcolor: 'transparent',
          color: 'primary.main',
        },
        color: 'text.secondary',
        fontWeight: 600,
        p: 0,
      }}
      variant="text"
    >
      {text}
    </Button>
  )
}

export default RedirectButton

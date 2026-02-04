import { Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'

import linksData from '~/libs/quicklinks.json'

interface Link {
  href: string
  label: string
}
interface Links {
  links: Link[]
}

const QuickLinks = () => {
  const { links } = linksData as Links

  return (
    <Stack
      borderLeft={1}
      padding={2}
      spacing={1}
      sx={{
        bgcolor: 'white',
        borderColor: alpha(theme.palette.primary.main, 0.1),
        flexShrink: 0,
      }}
      width={240}
    >
      <Typography color="black" fontSize={14} fontWeight={600}>
        Quick Links
      </Typography>
      <Stack gap={1}>
        {links.map(({ href, label }, index) => {
          return (
            <Button
              key={index}
              //   TODO: replace this with page redirect functionality
              onClick={() => console.log(href)}
              size="large"
              sx={{ gap: 1, height: 40 }}
              variant="outlined"
            >
              <Typography fontSize={14} fontWeight={500}>
                {label}
              </Typography>
            </Button>
          )
        })}
      </Stack>
    </Stack>
  )
}

export default QuickLinks

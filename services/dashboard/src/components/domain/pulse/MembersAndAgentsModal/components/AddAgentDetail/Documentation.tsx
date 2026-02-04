import { LinkOutlined } from '@mui/icons-material'
import { alpha, Box, Link, Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'

export const Documentation = () => {
  const { t } = useTranslation(['common', 'agent'])

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography fontWeight="bold" variant="h6">
          {t('documentation')}
        </Typography>
        <Typography color="text.secondary">
          {t('documentation_description', { ns: 'agent' })}
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography fontWeight="bold" variant="body1">
          {t('tools')}
        </Typography>
        <Typography color="text.secondary">
          {t('tools_description', { ns: 'agent' })}
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Button
          sx={{
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              borderColor: alpha(theme.palette.primary.main, 0.25),
            },
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderColor: alpha(theme.palette.primary.main, 0.2),
            color: 'text.primary',
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            justifyContent: 'start',
            overflow: 'hidden',
            p: 0,
          }}
          variant="outlined"
        >
          <Box bgcolor={alpha(theme.palette.primary.main, 0.2)} p={2}>
            <LinkOutlined sx={{ color: 'primary.main' }} />
          </Box>
          <Stack alignItems="start" justifyContent="start">
            <Typography color="text.primary" fontWeight="bold" variant="body1">
              {t('full_documentation', { ns: 'agent' })}
            </Typography>
            <Typography color="primary.main" variant="caption">
              {t('click_to_redirect', { ns: 'agent' })}
            </Typography>
          </Stack>
        </Button>
        <Typography color="text.secondary" variant="caption">
          {t('or_visit', { ns: 'agent' })}:{' '}
          <Link href="https://github.com/github/github-mcp-server?tab=readme-ov-file#tools">
            https://github.com/github/github-mcp-server?tab=readme-ov-file#tools
          </Link>
        </Typography>
      </Stack>
    </Stack>
  )
}

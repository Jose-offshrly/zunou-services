import MenuIcon from '@mui/icons-material/Menu'
import {
  Box,
  Breadcrumbs,
  Stack,
  SvgIconTypeMap,
  Typography,
} from '@mui/material'
import { Theme } from '@mui/material/styles'
import { SxProps } from '@mui/system'
import { OverridableComponent } from '@mui/types'
import { Fragment } from 'react'

import { toggleSidebar } from '../../services/Sidebar'
import { theme } from '../../services/Theme'
import { IconButton } from '../form/IconButton'
import { LoadingButton } from '../form/LoadingButton'
import { ButtonLink } from '../navigation/ButtonLink'
import { Link } from '../navigation/Link'

interface Action {
  label: string
  href?: string
  Icon?: OverridableComponent<SvgIconTypeMap<Record<string, unknown>>>
  loading?: boolean
  onClick?: () => void
  target?: '_blank'
}

interface Crumb {
  label: string
  href: string
}

interface Props {
  actions?: Action[]
  breadcrumbs: Crumb[]
  sx?: SxProps<Theme>
}

export const PageHeading = ({ actions = [], breadcrumbs, sx }: Props) => {
  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      maxHeight={64}
      px={4}
      py={3}
      sx={{
        backgroundColor: 'white',
        borderBottomColor: 'divider',
        borderBottomStyle: 'solid',
        borderBottomWidth: '1px',
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        flex={1}
        justifyContent="space-between"
        sx={{
          ...sx,
        }}
      >
        <IconButton
          color="default"
          onClick={() => toggleSidebar()}
          sx={{
            display: { md: 'none', xs: 'flex' },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Breadcrumbs
          aria-label="breadcrumb"
          separator={
            <Typography
              component="span"
              sx={{ color: theme.palette.grey['400'] }}
              variant="h6"
            >
              /
            </Typography>
          }
        >
          {breadcrumbs.map((crumb: Crumb) => (
            <Link
              color="inherit"
              href={crumb.href}
              key={`heading-crumb-${crumb.label}`}
              sx={{
                '&:hover': {
                  color: theme.palette.primary.dark,
                },
              }}
              underline="none"
            >
              <Typography
                component="span"
                sx={{ fontWeight: 'bold' }}
                variant="h6"
              >
                {crumb.label}
              </Typography>
            </Link>
          ))}
        </Breadcrumbs>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
          }}
        >
          {actions.map(
            ({ href, Icon, label, loading, onClick, target }: Action) => (
              <Fragment key={`heading-action-${label}`}>
                {href ? (
                  <ButtonLink
                    href={href}
                    key={`heading-action-${label}`}
                    size="medium"
                    startIcon={Icon ? <Icon /> : undefined}
                    target={target}
                    variant="outlined"
                  >
                    {label}
                  </ButtonLink>
                ) : null}

                {onClick ? (
                  <LoadingButton
                    key={`heading-action-${label}`}
                    loading={loading}
                    onClick={onClick}
                    size="medium"
                    startIcon={Icon ? <Icon /> : undefined}
                    variant="contained"
                  >
                    {label}
                  </LoadingButton>
                ) : null}
              </Fragment>
            ),
          )}
        </Box>
      </Stack>
    </Stack>
  )
}

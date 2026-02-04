import { ExpandMoreOutlined, SmartToyOutlined } from '@mui/icons-material'
import { Divider, Icon, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { TaskType } from '@zunou-graphql/core/graphql'
import zunouChatIcon from '@zunou-react/assets/images/zunou-chat-icon.svg'
import { Button } from '@zunou-react/components/form'
import { Image } from '@zunou-react/components/utility'
import { theme } from '@zunou-react/services/Theme'

import { withStopPropagation } from '~/utils/withStopPropagation'

import { useHooks } from './hooks'

interface TaskAssistantDropdownProps {
  title: string
  type?: TaskType
}

export const TaskAssistantDropdown = ({
  title,
  type = TaskType.Task,
}: TaskAssistantDropdownProps) => {
  const {
    anchorEl,
    handleAssistant,
    handleClick,
    handleClose,
    open,
    options,
    t,
  } = useHooks({ title, type })

  return (
    <>
      <Button
        onClick={withStopPropagation(handleClick)}
        size="small"
        sx={{
          borderRadius: 20,
        }}
        variant="outlined"
      >
        <Image
          alt="Logo"
          height={24}
          src={zunouChatIcon}
          style={{ display: 'block' }}
        />
        <ExpandMoreOutlined fontSize="small" />
      </Button>
      <Menu
        anchorEl={anchorEl}
        onClose={handleClose}
        open={open}
        slotProps={{
          paper: {
            style: {
              border: `1px solid ${theme.palette.grey['200']}`,
              boxShadow: 'none',
              marginTop: 4,
              minWidth: 160,
            },
          },
        }}
      >
        <MenuItem disabled={true} onClick={handleAssistant}>
          <Stack alignItems="center" direction="row" spacing={1}>
            <Icon component={SmartToyOutlined} fontSize="small" />
            <Typography fontSize="small">{t('assistant')}</Typography>
          </Stack>
        </MenuItem>
        <Divider />
        {options.map(({ isActive = false, icon, name, onClick }, index) => {
          return (
            <MenuItem disabled={!isActive} key={index} onClick={onClick}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Icon component={icon} fontSize="small" />
                <Typography fontSize="small">{name}</Typography>
              </Stack>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

// import { MoreHoriz } from '@mui/icons-material' // NOTE: Removed for v0.1
import {
  // IconButton, // NOTE: Removed for v0.1
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Typography,
} from '@mui/material'
import { Thread } from '@zunou-graphql/core/graphql'
// import { theme } from '@zunou-react/services/Theme' // NOTE: Removed for v0.1
import { useNavigate, useParams } from 'react-router-dom'

import { Routes } from '~/services/Routes'
import { categorizeThreads } from '~/utils/categorizeThreads'

interface Props {
  threads?: Thread[]
}

export const ThreadList = ({ threads }: Props) => {
  const categorizedThreads = categorizeThreads(threads)
  const navigate = useNavigate()
  const { organizationId, threadId } = useParams()

  const handleOpenThread = (threadId: string) => {
    if (!organizationId) throw new Error('Organization ID not found')

    navigate(
      Routes.ThreadDetail.replace(':organizationId', organizationId).replace(
        ':threadId',
        threadId,
      ),
    )
  }

  // NOTE: Removed for v0.1
  // const handleMoreAction = (e: React.MouseEvent<HTMLButtonElement>) => {
  //   e.stopPropagation()
  //   alert('Hello Developer! Please implement the more action')
  // }

  return (
    <List
      subheader={<li />}
      sx={{
        '& ul': { paddingX: '0' },
        position: 'relative',
        width: '100%',
      }}
    >
      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          listStyleType: 'none',
        }}
      >
        {Object.entries(categorizedThreads)
          .sort(([a], [b]) => {
            const order: { [key: string]: number } = {
              'Previous 7 days': 3,
              Today: 1,
              Yesterday: 2,
            }

            return order[a] - order[b]
          })
          .map(([category, threads]) => (
            <li key={category}>
              <ul>
                <ListSubheader sx={{ paddingX: 0 }}>
                  <Typography
                    fontSize={12}
                    fontWeight={600}
                    height={24}
                    sx={{
                      color: 'black',
                      mb: 0.5,
                      textIndent: 8,
                    }}
                  >
                    {category}
                  </Typography>
                </ListSubheader>
                {threads.map(({ id, name }) => (
                  <ListItem
                    component="div"
                    disableGutters={true}
                    disablePadding={true}
                    key={id}
                    sx={{
                      '&:hover .moreIcon': {
                        display: 'flex',
                      },
                      color: 'black',
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleOpenThread(id)}
                      selected={id === threadId}
                      sx={{ borderRadius: 2, height: 42, paddingX: 1 }}
                    >
                      <ListItemText>
                        <Typography fontSize={14} noWrap={true}>
                          {name}
                        </Typography>
                      </ListItemText>
                      {/* NOTE: Removed for v0.1 */}
                      {/* <IconButton
                        className="moreIcon"
                        onClick={handleMoreAction}
                        size="small"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: theme.palette.grey['600'],
                          },
                          color: theme.palette.grey['400'],
                          display: 'none',
                        }}
                      >
                        <MoreHoriz />
                      </IconButton> */}
                    </ListItemButton>
                  </ListItem>
                ))}
              </ul>
            </li>
          ))}
      </ul>
    </List>
  )
}
